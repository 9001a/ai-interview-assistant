import { NextResponse } from 'next/server';
import { analyzeJD } from '@/lib/openai';
import type { JDAnalyzerConfig } from '@/types';

export async function POST(request: Request) {
  try {
    const { jdText, config } = await request.json();

    if (!jdText || jdText.trim().length < 20) {
      return NextResponse.json(
        { success: false, error: '请输入有效的岗位描述（至少20个字）' },
        { status: 400 }
      );
    }

    console.log('🔍 开始分析JD...');
    const result = await analyzeJD(jdText, config as JDAnalyzerConfig);
    console.log('✅ JD分析完成');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ JD分析失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '分析失败，请检查API Key配置后重试' },
      { status: 500 }
    );
  }
}
