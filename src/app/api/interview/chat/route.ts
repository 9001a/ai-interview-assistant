import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestion, evaluateAnswer } from '@/lib/openai';
import type { JDAnalysis, Resume, InterviewerConfig, ChatMessage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const {
      mode,
      jdAnalysis,
      resume,
      interviewerConfig,
      messages,
      userAnswer,
      lastQuestion,
    } = await req.json();

    if (mode === 'question') {
      // 生成第一个问题或下一个问题
      const question = await generateInterviewQuestion(
        jdAnalysis,
        resume,
        interviewerConfig,
        messages
      );

      return NextResponse.json({ success: true, question });
    } else if (mode === 'evaluate') {
      // 评估回答
      const evaluation = await evaluateAnswer(
        userAnswer,
        lastQuestion,
        jdAnalysis,
        interviewerConfig
      );

      return NextResponse.json({ success: true, evaluation });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid mode' },
      { status: 400 }
    );
  } catch (error) {
    console.error('面试API错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '面试失败' },
      { status: 500 }
    );
  }
}
