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
  const prompt = `你是一位专业的JD分析专家。请基于以下目标JD内容，结合行业通用标准，客观、全面地完成4个维度的分析。

要求：
- 全程贴合JD原文，不添加无关内容、不主观臆断
- 语言简洁专业，同时兼顾易懂性
- 不堆砌JD原文，用自己的语言提炼总结
- 严格按以下JSON格式输出

目标JD：
${jdText}

请按以下格式输出JSON（不要其他内容）：
{
  "overview": "岗位概述：结合JD的岗位职责、定位，用通俗专业的语言说明核心定位、本质工作内容、服务于哪个部门/业务板块、核心工作价值。重点说明该岗位实际要干的事。",
  "requirements": "隐含要求：结合JD明确要求和行业通用标准，延伸拆解隐含任职要求。包括：1.技能类（结合JD技能延伸隐含技能）；2.经验类（JD未明确但行业通用的经验）；3.软实力（结合岗位特性推导的沟通、协调、细节敏感度等）；4.其他隐含要求（学历、年限、加班、出差等行业默认门槛）。",
  "dailyWork": "日常工作：严格基于JD的岗位职责板块，拆解并延伸日常工作内容，贴合实际工作场景。结合JD要求延伸为具体工作事项，确保每一项都能对应JD原文。",
  "prospects": "发展前景：结合JD岗位层级、所属行业，客观分析职业发展路径。包括：1.纵向晋升（初级→中级→资深→主管）；2.横向转型（基于核心技能可转型的相关岗位）；3.发展优势（行业需求、核心竞争力）。"
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
