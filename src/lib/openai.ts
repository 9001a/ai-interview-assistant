import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE,
});

export interface JDAnalysisResult {
  summary: {
    overview: string;
    hiddenRequirements: string;
    dailyWork: string;
    prospects: string;
  };
  tags: string[];
}

export async function analyzeJD(jdText: string): Promise<JDAnalysisResult> {
  const prompt = `你是一位专业的JD分析专家。请基于以下目标JD内容，结合行业通用标准，客观、全面地完成4个维度的分析。

要求：
- 全程贴合JD原文，不添加无关内容、不主观臆断
- 语言简洁专业，同时兼顾易懂性
- 不堆砌JD原文，用自己的语言提炼总结
- 提取3-5个核心技能标签
- 严格按以下JSON格式输出

目标JD：
${jdText}

请按以下格式输出JSON（不要其他内容）：
{
  "summary": {
    "overview": "岗位概述：结合JD的岗位职责、定位，用通俗专业的语言说明核心定位、本质工作内容、服务于哪个部门/业务板块、核心工作价值。重点说明该岗位实际要干的事。",
    "hiddenRequirements": "隐含要求：结合JD明确要求和行业通用标准，延伸拆解隐含任职要求。包括：1.技能类（结合JD技能延伸隐含技能）；2.经验类（JD未明确但行业通用的经验）；3.软实力（结合岗位特性推导的沟通、协调、细节敏感度等）；4.其他隐含要求（学历、年限、加班、出差等行业默认门槛）。",
    "dailyWork": "日常工作：严格基于JD的岗位职责板块，拆解并延伸日常工作内容，贴合实际工作场景。结合JD要求延伸为具体工作事项，确保每一项都能对应JD原文。",
    "prospects": "发展前景：结合JD岗位层级、所属行业，客观分析职业发展路径。包括：1.纵向晋升（初级→中级→资深→主管）；2.横向转型（基于核心技能可转型的相关岗位）；3.发展优势（行业需求、核心竞争力）。"
  },
  "tags": ["技能标签1", "技能标签2", "技能标签3"]
}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content || '{}';
  try {
    const result = JSON.parse(content);
    return {
      summary: {
        overview: result.summary?.overview || '',
        hiddenRequirements: result.summary?.hiddenRequirements || '',
        dailyWork: result.summary?.dailyWork || '',
        prospects: result.summary?.prospects || '',
      },
      tags: result.tags || [],
    };
  } catch {
    return {
      summary: {
        overview: '分析失败，请重试',
        hiddenRequirements: '',
        dailyWork: '',
        prospects: '',
      },
      tags: [],
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

export interface ResumeOptimizationResult {
  content: string;
  highlights: string[];
  score: number;
}

export async function optimizeResume(
  resumeContent: string,
  jdTexts: string[]
): Promise<ResumeOptimizationResult> {
  const prompt = `你是一位资深的简历优化专家。请基于以下${jdTexts.length}个JD的共同要求，优化用户的简历。

${jdTexts.map((jd, idx) => `【JD ${idx + 1}】
${jd}
`).join('\n')}

用户简历内容：
${resumeContent}

请完成以下任务：
1. 分析这些JD的共同核心要求（技能、经验、特质）
2. 优化简历表述，使其更符合这些共同要求
3. 保持简历的真实性，润色表达方式、突出相关经验
4. 指出优化的亮点（3-5条）
5. 给出优化匹配度评分（0-100分）

请按以下JSON格式输出（不要其他内容）：
{
  "content": "优化后的完整简历内容",
  "highlights": [
    "亮点1：具体优化了什么",
    "亮点2：具体优化了什么",
    "亮点3：具体优化了什么"
  ],
  "score": 85
}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content || '{}';
  try {
    const result = JSON.parse(content);
    return {
      content: result.content || '优化失败',
      highlights: result.highlights || [],
      score: Math.min(100, Math.max(0, result.score || 70)),
    };
  } catch {
    return {
      content: '优化结果解析失败，请重试',
      highlights: [],
      score: 0,
    };
  }
}

export default openai;
