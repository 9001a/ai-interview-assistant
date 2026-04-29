/**
 * 简历解析工具
 * 支持 PDF 和 Word 格式
 */

// 使用 CommonJS 导入方式
const pdfParseLib = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * 解析 PDF 简历
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParseLib(buffer);
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
 * 生成简历摘要
 */
export function generateSummary(content: string): string {
  // 提取关键信息
  const lines = content.split('\n').filter(line => line.trim());
  
  // 提取姓名（第一行或包含"姓名"的行）
  const nameLine = lines.find(line => 
    line.includes('姓名') || 
    /^[\u4e00-\u9fa5]{2,4}$/.test(line.trim())
  );
  
  // 提取邮箱
  const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
  
  // 提取电话
  const phoneMatch = content.match(/1[3-9]\d{9}/);
  
  // 提取工作年限
  const expMatch = content.match(/(\d+)[\s]*年[\s]*经验/);
  
  // 提取技能关键词
  const skills = ['Java', 'Python', 'JavaScript', 'React', 'Vue', 'Spring', 
                  'MySQL', 'Redis', 'Docker', 'K8s', 'Go', 'C++'];
  const foundSkills = skills.filter(skill => 
    content.toLowerCase().includes(skill.toLowerCase())
  );
  
  const parts = [
    nameLine ? `姓名：${nameLine.replace(/姓名[：:]?/, '').trim()}` : '',
    emailMatch ? `邮箱：${emailMatch[0]}` : '',
    phoneMatch ? `电话：${phoneMatch[0]}` : '',
    expMatch ? `经验：${expMatch[1]}年` : '',
    foundSkills.length > 0 ? `技能：${foundSkills.join('、')}` : ''
  ].filter(Boolean);
  
  return parts.join(' | ') || '简历内容已解析';
}

/**
 * 根据文件类型解析简历
 */
export async function parseResume(
  buffer: Buffer,
  mimeType: string
): Promise<{ content: string; summary: string }> {
  let content = '';
  
  if (mimeType === 'application/pdf') {
    content = await parsePDF(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    content = await parseWord(buffer);
  } else {
    throw new Error('不支持的文件格式');
  }
  
  const summary = generateSummary(content);
  
  return { content, summary };
}