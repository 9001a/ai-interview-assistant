/**
 * 文档切分算法 - 三级父子块结构
 * 
 * 一级：文档
 *   └── 二级：段落块（语义完整的块）
 *         └── 三级：句子/短片段（实际存储向量的最小单元）
 */

import { KnowledgeChunk, KnowledgeSegment } from '@/types';

// 配置参数
const CHUNK_CONFIG = {
  // 二级段落块配置
  paragraph: {
    minLength: 50,      // 最小段落长度
    maxLength: 500,     // 最大段落长度（防止过长段落）
    overlap: 50,        // 段落重叠长度（保持上下文连贯）
  },
  // 三级片段配置
  segment: {
    minLength: 20,      // 最小片段长度
    maxLength: 100,     // 最大片段长度
    overlap: 10,        // 片段重叠长度
  }
};

/**
 * 将文档切分为段落（二级块）
 * 支持按换行、标点符号切分
 */
export function splitIntoParagraphs(text: string): string[] {
  // 先按双换行符切分（自然段落）
  const rawParagraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const paragraphs: string[] = [];
  
  for (const raw of rawParagraphs) {
    const trimmed = raw.trim();
    
    // 如果段落过长，按句子切分
    if (trimmed.length > CHUNK_CONFIG.paragraph.maxLength) {
      const sentences = splitIntoSentences(trimmed);
      let currentParagraph = '';
      
      for (const sentence of sentences) {
        if (currentParagraph.length + sentence.length > CHUNK_CONFIG.paragraph.maxLength) {
          if (currentParagraph.length >= CHUNK_CONFIG.paragraph.minLength) {
            paragraphs.push(currentParagraph.trim());
          }
          currentParagraph = sentence;
        } else {
          currentParagraph += sentence;
        }
      }
      
      if (currentParagraph.length >= CHUNK_CONFIG.paragraph.minLength) {
        paragraphs.push(currentParagraph.trim());
      }
    } else if (trimmed.length >= CHUNK_CONFIG.paragraph.minLength) {
      paragraphs.push(trimmed);
    }
  }
  
  return paragraphs;
}

/**
 * 将文本切分为句子
 */
export function splitIntoSentences(text: string): string[] {
  // 按中文/英文标点符号切分
  const sentenceRegex = /[^。？！.?!]+[。？！.?!]+/g;
  const matches = text.match(sentenceRegex);
  
  if (!matches) {
    // 如果没有标点，按固定长度切分
    return splitByLength(text, CHUNK_CONFIG.segment.maxLength);
  }
  
  return matches.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * 将段落切分为片段（三级块）
 */
export function splitParagraphIntoSegments(paragraph: string): string[] {
  const sentences = splitIntoSentences(paragraph);
  const segments: string[] = [];
  
  let currentSegment = '';
  
  for (const sentence of sentences) {
    if (currentSegment.length + sentence.length > CHUNK_CONFIG.segment.maxLength) {
      if (currentSegment.length >= CHUNK_CONFIG.segment.minLength) {
        segments.push(currentSegment.trim());
      }
      currentSegment = sentence;
    } else {
      currentSegment += sentence;
    }
  }
  
  if (currentSegment.length >= CHUNK_CONFIG.segment.minLength) {
    segments.push(currentSegment.trim());
  }
  
  return segments;
}

/**
 * 按固定长度切分文本
 */
function splitByLength(text: string, maxLength: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    result.push(text.slice(i, i + maxLength));
  }
  return result;
}

/**
 * 生成段落摘要（用于快速了解段落内容）
 */
export function generateChunkSummary(paragraph: string): string {
  // 取前100个字符作为摘要
  const maxSummaryLength = 100;
  if (paragraph.length <= maxSummaryLength) {
    return paragraph;
  }
  return paragraph.slice(0, maxSummaryLength) + '...';
}

/**
 * 生成文档摘要
 */
export function generateDocumentSummary(content: string): string {
  const maxSummaryLength = 200;
  const paragraphs = splitIntoParagraphs(content);
  
  if (paragraphs.length === 0) {
    return content.slice(0, maxSummaryLength);
  }
  
  // 取前几个段落拼接
  let summary = '';
  for (const p of paragraphs.slice(0, 3)) {
    if (summary.length + p.length > maxSummaryLength) {
      break;
    }
    summary += p + '\n';
  }
  
  return summary.trim().slice(0, maxSummaryLength);
}

/**
 * 完整的文档切分流程
 * 返回二级段落块列表（包含三级片段）
 */
export function chunkDocument(content: string): Omit<KnowledgeChunk, 'embedding'>[] {
  const paragraphs = splitIntoParagraphs(content);
  const chunks: Omit<KnowledgeChunk, 'embedding'>[] = [];
  
  let globalIndex = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paragraphStart = content.indexOf(paragraph, globalIndex);
    const paragraphEnd = paragraphStart + paragraph.length;
    
    // 切分为三级片段
    const segmentTexts = splitParagraphIntoSegments(paragraph);
    const segments: Omit<KnowledgeSegment, 'embedding'>[] = [];
    
    let segmentIndex = 0;
    for (let j = 0; j < segmentTexts.length; j++) {
      const segmentText = segmentTexts[j];
      const segmentStart = paragraph.indexOf(segmentText, segmentIndex);
      const segmentEnd = segmentStart + segmentText.length;
      
      segments.push({
        id: `seg_${i}_${j}_${Date.now()}`,
        content: segmentText,
        parentChunkId: `chunk_${i}_${Date.now()}`,
        startIndex: segmentStart,
        endIndex: segmentEnd,
      });
      
      segmentIndex = segmentEnd;
    }
    
    chunks.push({
      id: `chunk_${i}_${Date.now()}`,
      content: paragraph,
      summary: generateChunkSummary(paragraph),
      startIndex: paragraphStart,
      endIndex: paragraphEnd,
      segments: segments as KnowledgeSegment[],
    });
    
    globalIndex = paragraphEnd;
  }
  
  return chunks;
}

// 别名导出，兼容旧代码
export { chunkDocument as splitIntoChunks };
