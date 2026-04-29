import { NextRequest, NextResponse } from 'next/server';

// 尝试初始化 OpenAI（如果有配置的话）
// let openai: OpenAI | null = null;
// try {
//   openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY || '',
//   });
// } catch (e) {
//   console.log('OpenAI not configured, using mock report generation');
// }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, jdAnalysis, resume, interviewerConfig } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少对话消息' 
      }, { status: 400 });
    }

    let report;

    // 暂时只用规则生成，避免环境问题
    report = generateRuleBasedReport(messages);
    
    // if (openai && process.env.OPENAI_API_KEY) {
    //   // 使用真实AI生成报告
    //   report = await generateAIReport(messages, jdAnalysis, resume, interviewerConfig);
    // } else {
    //   // 如果没有配置API key，使用基于规则的生成
    //   report = generateRuleBasedReport(messages);
    // }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '生成报告失败' 
    }, { status: 500 });
  }
}

// async function generateAIReport(
//   messages: any[], 
//   jdAnalysis: any, 
//   resume: any, 
//   interviewerConfig: any
// ) {
//   if (!openai) throw new Error('OpenAI not initialized');

//   const conversationText = messages
//     .filter((m: any) => m.role === 'user' || m.role === 'assistant')
//     .map((m: any) => `${m.role === 'user' ? '候选人' : '面试官'}: ${m.content}`)
//     .join('\n\n');

//   const prompt = `你是一位专业的面试评估专家。请根据以下面试对话，生成一份详细的面试报告。

// ## 面试对话
// ${conversationText}

// ## JD分析（如果有）
// ${jdAnalysis ? JSON.stringify(jdAnalysis, null, 2) : '无'}

// ## 简历信息（如果有）
// ${resume ? JSON.stringify(resume, null, 2) : '无'}

// 请生成以下格式的JSON报告：
// {
//   "score": 0-100的综合评分,
//   "strengths": ["优势1", "优势2", "优势3"],
//   "weaknesses": ["待提升1", "待提升2"],
//   "suggestions": ["建议1", "建议2", "建议3"]
// }

// 要求：
// 1. score 要根据对话质量真实评估
// 2. strengths 至少3条
// 3. weaknesses 1-3条
// 4. suggestions 至少3条，要有针对性
// 5. 用中文输出
// 6. 只返回JSON，不要其他文字`;

//   const response = await openai.chat.completions.create({
//     model: 'gpt-3.5-turbo',
//     messages: [
//       { role: 'system', content: '你是一位专业的面试评估专家。' },
//       { role: 'user', content: prompt },
//     ],
//     temperature: 0.7,
//   });

//   const content = response.choices[0]?.message?.content || '';
  
//   try {
//     const jsonMatch = content.match(/\{[\s\S]*\}/);
//     if (jsonMatch) {
//       return JSON.parse(jsonMatch[0]);
//     }
//   } catch (e) {
//     console.log('Failed to parse AI response, using fallback');
//   }

//   return generateRuleBasedReport(messages);
// }

function generateRuleBasedReport(messages: any[]) {
  const userMessages = messages.filter((m: any) => m.role === 'user');
  const assistantMessages = messages.filter((m: any) => m.role === 'assistant');
  
  const totalTurns = userMessages.length;
  
  let score = 60; // 基础分
  
  if (totalTurns >= 10) score += 10;
  if (totalTurns >= 20) score += 10;
  
  const avgLength = userMessages.reduce((sum: number, m: any) => sum + (m.content?.length || 0), 0) / Math.max(userMessages.length, 1);
  
  if (avgLength > 100) score += 10;
  if (avgLength > 200) score += 5;
  
  score = Math.min(score, 95);

  const strengths = [
    '能够积极参与面试，完成了多轮对话',
    '对问题有一定的理解和思考',
    '表达能力良好，能够清晰传达想法',
  ];

  const weaknesses: string[] = [];
  if (totalTurns < 10) {
    weaknesses.push('面试回合较少，未能充分展示能力');
  }
  if (avgLength < 50) {
    weaknesses.push('部分回答不够详细，可以更深入展开');
  }

  const suggestions = [
    '建议在回答问题时更加具体，多举实际例子',
    '可以提前准备一些常见面试题的标准答案',
    '深入学习岗位相关的专业知识',
    '多进行模拟面试练习，提升应变能力',
  ];

  return {
    score,
    strengths,
    weaknesses: weaknesses.length > 0 ? weaknesses : ['继续保持，争取更好的表现'],
    suggestions,
  };
}
