import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE,
});

export type JDAnalysisResult = {
  overview: string;
  requirements: string;
  dailyWork: string;
  prospects: string;
};

export async function analyzeJD(jdText: string): Promise<JDAnalysisResult> {
  const prompt = `你是一个专业的招聘分析师，请从以下四个维度分析这个岗位描述，用简洁明了的语言回答。

岗位描述：
${jdText}

请按以下格式输出JSON（不要其他内容）：
{
  "overview": "岗位概述（这个岗位实际是做什么的，用大白话讲）",
  "requirements": "隐含要求（除了JD上写的，还需要哪些技能和经验）",
  "dailyWork": "日常工作（这个岗位日常会做什么）",
  "prospects": "发展前景（这个岗位的职业发展路径）"
}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content || '{}';
  try {
    return JSON.parse(content);
  } catch {
    return {
      overview: '分析失败，请重试',
      requirements: '',
      dailyWork: '',
      prospects: '',
    };
  }
}

export async function* streamInterview(
  systemPrompt: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
) {
  const allMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages,
  ];

  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: allMessages,
    stream: true,
    temperature: 0.8,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) yield content;
  }
}

export async function optimizeResume(
  resumeContent: string,
  jdAnalysis: JDAnalysisResult
): Promise<string> {
  const prompt = `你是一个专业的简历优化师。请根据以下JD分析结果，优化用户的简历表述，使其更符合岗位要求。

JD分析结果：
- 岗位概述：${jdAnalysis.overview}
- 隐含要求：${jdAnalysis.requirements}
- 日常工作：${jdAnalysis.dailyWork}

用户简历内容：
${resumeContent}

请优化简历表述，让它更符合这个岗位的要求。保持简历的真实性，但可以润色表达方式、突出相关经验。`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content || '优化失败，请重试';
}

export default openai;
