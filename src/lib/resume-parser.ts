import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

const pdf = (pdfParse as any).default || pdfParse; // 兼容 CommonJS/ESM 导入方式

/**
 * 解析 PDF 简历
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('PDF 解析失败，请检查文件格式');
  }
}

/**
 * 解析 Word 简历
 */
export async function parseWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error('Word parse error:', error);
    throw new Error('Word 解析失败，请检查文件格式');
  }
}

/**
 * 根据文件类型解析简历
 */
export async function parseResume(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return parsePDF(buffer);
    case 'docx':
    case 'doc':
      return parseWord(buffer);
    default:
      throw new Error('不支持的文件格式，请上传 PDF 或 Word 文件');
  }
}
