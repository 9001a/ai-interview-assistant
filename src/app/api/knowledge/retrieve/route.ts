/**
 * 知识库检索 API
 * 支持 Dense Retrieval、Sparse Retrieval 和 Hybrid Search
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmbedding, cosineSimilarity } from '@/lib/embedding';
import { rerank } from '@/lib/rerank';

// 从 storage 读取知识库文档（模拟服务端访问）
// 实际生产环境应该使用数据库
async function getDocumentsFromStorage(userId: string): Promise<any[]> {
  // 这里简化处理，实际应该从数据库读取
  // 客户端上传的文档会通过 API 存入数据库
  return [];
}

/**
 * POST /api/knowledge/retrieve
 * 检索知识库文档
 * 
 * Body: {
 *   query: string,           // 查询文本
 *   userId: string,          // 用户ID
 *   mode?: 'vector' | 'keyword' | 'hybrid' | 'rerank',  // 检索模式
 *   topK?: number,           // 返回结果数量
 *   documentIds?: string[],  // 指定搜索的文档ID列表（可选）
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      userId, 
      mode = 'hybrid', 
      topK = 5,
      documentIds 
    } = body;

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: query, userId' },
        { status: 400 }
      );
    }

    // 获取用户文档（从客户端存储或通过其他方式）
    // 注意：这里需要从持久化存储读取，简化版本返回空
    const documents = await getDocumentsFromStorage(userId);
    
    if (documents.length === 0) {
      return NextResponse.json({
        results: [],
        mode,
        query,
        total: 0,
      });
    }

    let results: any[] = [];

    switch (mode) {
      case 'vector': {
        // Dense Retrieval - 向量语义检索
        const queryEmbedding = await getEmbedding(query);
        
        results = documents
          .filter((d: any) => d.embedding)
          .map((doc: any) => ({
            ...doc,
            score: cosineSimilarity(queryEmbedding, doc.embedding),
          }))
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, topK);
        break;
      }
      
      case 'keyword': {
        // Sparse Retrieval - BM25 关键词检索
        const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
        
        results = documents
          .map((doc: any) => {
            const content = ((doc.title || '') + ' ' + (doc.content || '')).toLowerCase();
            let score = 0;
            
            queryTerms.forEach((term: string) => {
              const regex = new RegExp(term, 'g');
              const matches = content.match(regex);
              if (matches) score += matches.length;
            });
            
            return { ...doc, score };
          })
          .filter((d: any) => d.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, topK);
        break;
      }
      
      case 'hybrid': {
        // Hybrid Search - RRF 融合
        const queryEmbedding = await getEmbedding(query);
        const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
        
        // 向量检索结果
        const vectorResults = documents
          .filter((d: any) => d.embedding)
          .map((doc: any) => ({
            ...doc,
            score: cosineSimilarity(queryEmbedding, doc.embedding),
            source: 'vector',
          }))
          .sort((a: any, b: any) => b.score - a.score);
        
        // 关键词检索结果
        const keywordResults = documents
          .map((doc: any) => {
            const content = ((doc.title || '') + ' ' + (doc.content || '')).toLowerCase();
            let score = 0;
            queryTerms.forEach((term: string) => {
              const regex = new RegExp(term, 'g');
              const matches = content.match(regex);
              if (matches) score += matches.length;
            });
            return { ...doc, score, source: 'keyword' };
          })
          .filter((d: any) => d.score > 0)
          .sort((a: any, b: any) => b.score - a.sort);
        
        // RRF 融合
        const k = 60;
        const rrfScores = new Map<string, any>();
        
        vectorResults.forEach((doc: any, index: number) => {
          const rank = index + 1;
          const existing = rrfScores.get(doc.id);
          if (existing) {
            existing.rrfScore += 1 / (k + rank);
          } else {
            rrfScores.set(doc.id, { ...doc, rrfScore: 1 / (k + rank) });
          }
        });
        
        keywordResults.forEach((doc: any, index: number) => {
          const rank = index + 1;
          const existing = rrfScores.get(doc.id);
          if (existing) {
            existing.rrfScore += 1 / (k + rank);
          } else {
            rrfScores.set(doc.id, { ...doc, rrfScore: 1 / (k + rank) });
          }
        });
        
        results = Array.from(rrfScores.values())
          .sort((a: any, b: any) => b.rrfScore - a.rrfScore)
          .slice(0, topK)
          .map((d: any) => ({ ...d, score: d.rrfScore }));
        break;
      }
      
      case 'rerank': {
        // 先进行 Hybrid Search，然后 Rerank 精排
        // 简化为直接返回 hybrid 结果
        // 实际生产环境应该调用 rerank 服务
        const queryEmbedding = await getEmbedding(query);
        
        results = documents
          .filter((d: any) => d.embedding)
          .map((doc: any) => ({
            ...doc,
            score: cosineSimilarity(queryEmbedding, doc.embedding),
          }))
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, topK);
        break;
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid mode. Use: vector, keyword, hybrid, or rerank' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      results: results.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content?.substring(0, 500), // 截断内容
        sourceType: r.sourceType,
        score: r.score,
        source: r.source || mode,
      })),
      mode,
      query,
      total: results.length,
    });
    
  } catch (error) {
    console.error('[RAG Retrieve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}
