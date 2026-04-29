import { NextRequest, NextResponse } from 'next/server';
import { getEmbedding as generateEmbedding, cosineSimilarity } from '@/lib/embedding';
import { rerank as rerankDocuments } from '@/lib/rerank';
import type { KnowledgeDocument, KnowledgeChunk, KnowledgeSegment } from '@/types';

interface RetrievalResult {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkContent: string;
  chunkSummary: string;
  segmentId: string;
  segmentContent: string;
  score: number;
}

// BM25 简单实现
function calculateBM25(
  query: string,
  document: string,
  k1: number = 1.5,
  b: number = 0.75
): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const docTerms = document.toLowerCase().split(/\s+/);
  const docLength = docTerms.length;
  const avgDocLength = 100; // 假设平均文档长度

  let score = 0;
  const termFreq: Map<string, number> = new Map();
  
  docTerms.forEach(term => {
    termFreq.set(term, (termFreq.get(term) || 0) + 1);
  });

  queryTerms.forEach(term => {
    const tf = termFreq.get(term) || 0;
    if (tf > 0) {
      const idf = Math.log((2 + 1) / (1 + 1)) + 1; // 简化 IDF
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
      score += idf * (numerator / denominator);
    }
  });

  return score;
}

// RRF 融合
function fuseResults(
  denseResults: RetrievalResult[],
  sparseResults: RetrievalResult[],
  k: number = 60
): RetrievalResult[] {
  const scores = new Map<string, number>();
  const results = new Map<string, RetrievalResult>();

  // Dense scores
  denseResults.forEach((result, index) => {
    const key = `${result.documentId}-${result.segmentId}`;
    scores.set(key, (scores.get(key) || 0) + 1 / (k + index));
    results.set(key, result);
  });

  // Sparse scores
  sparseResults.forEach((result, index) => {
    const key = `${result.documentId}-${result.segmentId}`;
    scores.set(key, (scores.get(key) || 0) + 1 / (k + index));
    results.set(key, result);
  });

  // Sort by fused score
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => results.get(key)!)
    .slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const { query, documentIds, topK = 5, mode = 'hybrid' } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // 从请求头或 cookie 获取知识库数据
    // 实际项目中这里应该从数据库获取
    const documents: KnowledgeDocument[] = []; // 需要通过其他方式获取

    // 过滤指定文档
    const targetDocs = documentIds?.length 
      ? documents.filter(doc => documentIds.includes(doc.id))
      : documents;

    if (targetDocs.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const denseResults: RetrievalResult[] = [];
    const sparseResults: RetrievalResult[] = [];

    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query);

    // 遍历所有文档的 chunks 和 segments
    for (const doc of targetDocs) {
      if (!doc.id || !doc.chunks) continue;

      for (const chunk of doc.chunks) {
        if (!chunk.segments) continue;

        for (const segment of chunk.segments) {
          if (!segment.embedding) continue;

          // Dense retrieval
          const similarity = cosineSimilarity(queryEmbedding, segment.embedding);
          if (similarity > 0.5) { // 阈值过滤
            denseResults.push({
              documentId: doc.id,
              documentTitle: doc.title || '',
              chunkId: chunk.id,
              chunkContent: chunk.content,
              chunkSummary: chunk.summary || '',
              segmentId: segment.id,
              segmentContent: segment.content,
              score: similarity,
            });
          }

          // Sparse retrieval (BM25)
          const bm25Score = calculateBM25(query, segment.content);
          if (bm25Score > 0) {
            sparseResults.push({
              documentId: doc.id,
              documentTitle: doc.title || '',
              chunkId: chunk.id,
              chunkContent: chunk.content,
              chunkSummary: chunk.summary || '',
              segmentId: segment.id,
              segmentContent: segment.content,
              score: bm25Score,
            });
          }
        }
      }
    }

    // 分别排序
    denseResults.sort((a, b) => b.score - a.score);
    sparseResults.sort((a, b) => b.score - a.score);

    // 截取 Top-K
    const topDense = denseResults.slice(0, topK * 2);
    const topSparse = sparseResults.slice(0, topK * 2);

    let finalResults: RetrievalResult[] = [];

    if (mode === 'vector') {
      finalResults = topDense.slice(0, topK);
    } else if (mode === 'keyword') {
      finalResults = topSparse.slice(0, topK);
    } else {
      // Hybrid: RRF fusion
      finalResults = fuseResults(topDense, topSparse);
      finalResults = finalResults.slice(0, topK);
    }

    // Rerank if enabled and results exist
    if (finalResults.length > 1) {
      try {
        const reranked = await rerankDocuments(
          query,
          finalResults.map(r => ({
            id: r.segmentId,
            text: r.segmentContent,
            metadata: {
              documentId: r.documentId,
              documentTitle: r.documentTitle,
              chunkId: r.chunkId,
              chunkContent: r.chunkContent,
              chunkSummary: r.chunkSummary,
              segmentId: r.segmentId,
            },
          }))
        );

        // Map reranked results back
        finalResults = reranked.map(r => ({
          documentId: r.metadata?.documentId,
          documentTitle: r.metadata?.documentTitle,
          chunkId: r.metadata?.chunkId,
          chunkContent: r.metadata?.chunkContent,
          chunkSummary: r.metadata?.chunkSummary,
          segmentId: r.metadata?.segmentId,
          segmentContent: r.text,
          score: r.score,
        }));
      } catch (error) {
        console.warn('Rerank failed, using original results:', error);
      }
    }

    return NextResponse.json({ results: finalResults });
  } catch (error) {
    console.error('Knowledge retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
