import { NextRequest, NextResponse } from 'next/server';
import { parseResume } from '@/lib/resume-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string;

    if (!file && !text) {
      return NextResponse.json(
        { error: '请上传文件或粘贴简历内容' },
        { status: 400 }
      );
    }

    let resumeContent = text || '';
    let filename = '直接粘贴';

    // 如果是文件，解析文件内容
    if (file) {
      filename = file.name;

      // 读取文件内容
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 解析简历
      const { content } = await parseResume(buffer, file.type);
      resumeContent = content;

      if (!resumeContent.trim()) {
        return NextResponse.json(
          { error: '无法从文件中提取文本内容，请检查文件是否包含可读文本' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      content: resumeContent,
      filename: filename,
    });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: error.message || '简历解析失败' },
      { status: 500 }
    );
  }
}
