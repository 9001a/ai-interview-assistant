/**
 * Rerank 服务 - 重排序精排
 * 使用 Cohere Cross-Encoder 或类似服务
 */

import axios from 'axios';

// Rerank 配置 - 从环境变量读取
const RERANK_API_KEY = process.env.RERANK_API_KEY || process.env.COHERE_API_KEY;
const RERANK_BASE_URL = process.env.RERANK_BASE_URL || 'https://api.cohere.com/v1';
const RERANK_MODEL = process.env.RERANK_MODEL || 'rerank-multilingual-v2.0';

// 是否使用模拟模式
const isMockMode = !RERANK_API_KEY;

export interface RerankDocument {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface RerankResult {
  id: string;
  score: number;
  index: number;
  text: string;
  metadata?: Record<string, any>;
}

/**
 * 对文档进行重排序
 * @param query 查询文本
 * @param documents 候选文档列表
 * @param topK 返回前 K 个结果
 * @returns 重排序后的结果
 */
export async function rerank(
  query: string,
  documents: RerankDocument[],
  topK: number = 5
): Promise<RerankResult[]> {
  if (isMockMode || documents.length === 0) {
    console.log('[Rerank] Mock mode or no documents, returning original order');
    return documents.map((doc, index) => ({
      id: doc.id,
      score: 1 - index * 0.1, // 模拟递减分数
      index,
      text: doc.text,
      metadata: doc.metadata,
    }));
  }

  try {
    const response = await axios.post(
      `${RERANK_BASE_URL}/rerank`,
      {
        model: RERANK_MODEL,
        query,
        documents: documents.map(d => d.text),
        top_n: topK,
        return_documents: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${RERANK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const results: RerankResult[] = response.data.results.map((item: any) => ({
      id: documents[item.index].id,
      score: item.relevance_score,
      index: item.index,
      text: documents[item.index].text,
      metadata: documents[item.index].metadata,
    }));

    console.log('[Rerank] Success, top score:', results[0]?.score);
    return results;
  } catch (error) {
    console.error('[Rerank] Error:', error);
    // 失败时返回原始顺序
    return documents.slice(0, topK).map((doc, index) => ({
      id: doc.id,
      score: 1 - index * 0.1,
      index,
      text: doc.text,
      metadata: doc.metadata,
    }));
  }
}

/**
 * 检查 Rerank 服务是否可用
 */
export function isRerankAvailable(): boolean {
  return !!RERANK_API_KEY;
}
