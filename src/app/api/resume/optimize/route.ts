import { NextRequest, NextResponse } from 'next/server';
import { optimizeResume } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeContent, jdTexts } = body;

    if (!resumeContent || !jdTexts || !Array.isArray(jdTexts) || jdTexts.length === 0) {
      return NextResponse.json(
        { error: '请提供简历内容和至少一个JD文本' },
        { status: 400 }
      );
    }

    // 调用 OpenAI 优化简历
    const result = await optimizeResume(resumeContent, jdTexts);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('简历优化失败:', error);
    return NextResponse.json(
      { error: '简历优化失败，请重试' },
      { status: 500 }
    );
  }
}
