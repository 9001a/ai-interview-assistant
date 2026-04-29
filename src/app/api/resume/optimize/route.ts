import { NextRequest, NextResponse } from 'next/server';
import { optimizeResume } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeContent, jdAnalysis } = body;

    if (!resumeContent || !jdAnalysis) {
      return NextResponse.json(
        { error: '请提供简历内容和JD分析结果' },
        { status: 400 }
      );
    }

    // 调用 OpenAI 优化简历
    const optimizedContent = await optimizeResume(resumeContent, jdAnalysis);

    return NextResponse.json({
      success: true,
      originalContent: resumeContent,
      optimizedContent: optimizedContent,
    });
  } catch (error) {
    console.error('简历优化失败:', error);
    return NextResponse.json(
      { error: '简历优化失败，请重试' },
      { status: 500 }
    );
  }
}
