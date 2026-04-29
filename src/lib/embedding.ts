/**
 * Embedding 服务 - 文本向量化
 * 支持 Dense Retrieval 语义检索
 */

import axios from 'axios';

// Embedding 配置 - 从环境变量读取
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY;
const EMBEDDING_BASE_URL = process.env.EMBEDDING_BASE_URL || process.env.OPENAI_API_BASE;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || '1536');

// 是否使用模拟模式
const isMockMode = !EMBEDDING_API_KEY;

/**
 * 获取文本的向量表示
 * @param text 输入文本
 * @returns 向量数组
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (isMockMode) {
    console.log('[Embedding] Mock mode, generating random vector');
    return generateMockVector(EMBEDDING_DIMENSION);
  }

  try {
    const response = await axios.post(
      `${EMBEDDING_BASE_URL}/embeddings`,
      {
        model: EMBEDDING_MODEL,
        input: text,
      },
      {
        headers: {
          'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const embedding = response.data.data[0].embedding;
    console.log('[Embedding] Success, dimension:', embedding.length);
    return embedding;
  } catch (error) {
    console.error('[Embedding] Error:', error);
    // 失败时返回模拟向量，避免中断流程
    return generateMockVector(EMBEDDING_DIMENSION);
  }
}

/**
 * 批量获取文本向量
 * @param texts 文本数组
 * @returns 向量数组
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (isMockMode) {
    return texts.map(() => generateMockVector(EMBEDDING_DIMENSION));
  }

  try {
    const response = await axios.post(
      `${EMBEDDING_BASE_URL}/embeddings`,
      {
        model: EMBEDDING_MODEL,
        input: texts,
      },
      {
        headers: {
          'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.data.map((item: { embedding: number[] }) => item.embedding);
  } catch (error) {
    console.error('[Embedding] Batch error:', error);
    return texts.map(() => generateMockVector(EMBEDDING_DIMENSION));
  }
}

/**
 * 计算余弦相似度
 * @param a 向量a
 * @param b 向量b
 * @returns 相似度分数 (0-1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 生成模拟向量（用于测试或 API 不可用时）
 */
function generateMockVector(dimension: number): number[] {
  const vector = [];
  for (let i = 0; i < dimension; i++) {
    vector.push(Math.random() * 2 - 1); // -1 到 1 之间
  }
  // 归一化
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(v => v / norm);
}

/**
 * 检查 Embedding 服务是否可用
 */
export function isEmbeddingAvailable(): boolean {
  return !!EMBEDDING_API_KEY;
}
