import { NextRequest, NextResponse } from 'next/server';
import { parseResume, generateSummary } from '@/lib/resume-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '请上传文件' },
        { status: 400 }
      );
    }

    // 检查文件类型
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '只支持 PDF 或 Word 文件' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('🔍 开始解析简历:', file.name, '类型:', file.type);

    // 解析简历
    const parseResult = await parseResume(buffer, file.type);
    const summary = generateSummary(parseResult.content);

    console.log('✅ 简历解析完成');

    return NextResponse.json({
      success: true,
      data: {
        content: parseResult.content,
        summary,
        filename: file.name,
      },
    });
  } catch (error: any) {
    console.error('❌ 简历解析失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '简历解析失败' },
      { status: 500 }
    );
  }
}
