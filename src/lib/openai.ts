import OpenAI from 'openai';
import type { JDAnalyzerConfig } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE,
});

// 模拟模式：当 OpenAI API 不可用时使用
const isMockMode = !process.env.OPENAI_API_KEY || process.env.USE_MOCK_AI === 'true';

export interface JDAnalysisResult {
  summary: {
    jobOverview: string;
    dailyWork: string;
    implicitRequirements: string;
    developmentProspect: string;
    companyBackground: string;
    salaryAnalysis: string;
    interviewFocus: string;
  };
  skillTags: string[];
}

// 分析维度映射（与 JDAnalyzerConfig 中的 key 保持一致）
const DIMENSION_MAP: Record<string, { name: string; desc: string }> = {
  jobOverview: { name: '岗位概述', desc: '结合JD的岗位职责、定位，说明核心定位、本质工作内容、核心工作价值' },
  dailyWork: { name: '日常工作', desc: '基于JD的岗位职责板块，拆解日常工作内容' },
  implicitRequirements: { name: '隐含要求', desc: '结合JD和行业通用标准，拆解隐含任职要求' },
  developmentProspect: { name: '发展前景', desc: '分析职业发展路径，包括纵向晋升、横向转型' },
  skillTags: { name: '技能标签', desc: '提取核心技能标签' },
  companyBackground: { name: '公司背景', desc: '分析公司规模、行业地位、发展阶段等' },
  salaryAnalysis: { name: '薪资分析', desc: '根据JD信息和行业水平分析薪资范围' },
  interviewFocus: { name: '面试重点', desc: '预测面试可能重点考察的能力和知识点' },
};

// 构建分析维度的提示文本
function buildDimensionsPrompt(dimensions: JDAnalyzerConfig['dimensions']): string {
  const enabled = Object.entries(dimensions)
    .filter(([_, value]) => value)
    .map(([key]) => {
      const dim = DIMENSION_MAP[key];
      return dim ? `${dim.name}：${dim.desc}` : key;
    });
  
  return enabled.join('\n');
}

// 根据启用的维度构建JSON字段示例
function buildJsonFieldsExample(dimensions: JDAnalyzerConfig['dimensions'], isEnglish: boolean): string {
  const examples: Record<string, string> = {
    jobOverview: isEnglish ? 'Job overview content...' : '岗位概述内容...',
    dailyWork: isEnglish ? 'Daily work content...' : '日常工作内容...',
    implicitRequirements: isEnglish ? 'Hidden requirements content...' : '隐含要求内容...',
    developmentProspect: isEnglish ? 'Development prospects content...' : '发展前景内容...',
    companyBackground: isEnglish ? 'Company background content...' : '公司背景内容...',
    salaryAnalysis: isEnglish ? 'Salary analysis content...' : '薪资分析内容...',
    interviewFocus: isEnglish ? 'Interview focus content...' : '面试重点内容...',
  };

  const fields = Object.entries(dimensions)
    .filter(([key, value]) => value && key !== 'skillTags')
    .map(([key]) => `    "${key}": "${examples[key]}"`)
    .join(',\n');

  return fields;
}

// 构建默认的分析 Prompt
function buildDefaultAnalyzePrompt(config: JDAnalyzerConfig): string {
  const dimensionsText = buildDimensionsPrompt(config.dimensions);
  const styleMap = {
    detailed: '详细、深入',
    concise: '简洁、凝练',
    professional: '专业、严谨',
  };
  const languageMap = {
    zh: '中文',
    en: '英文',
  };
  const isEnglish = config.language === 'en';
  const jsonFields = buildJsonFieldsExample(config.dimensions, isEnglish);
  const includeTags = config.dimensions.skillTags;

  return `你是一位专业的JD分析专家。请基于以下目标JD内容，结合行业通用标准，客观、全面地完成分析。

分析维度：
${dimensionsText}

分析要求：
- 全程贴合JD原文，不添加无关内容、不主观臆断
- 语言${styleMap[config.style]}，同时兼顾易懂性
- 使用${languageMap[config.language]}输出所有分析内容
- 不堆砌JD原文，用自己的语言提炼总结
${includeTags ? `- 提取${config.tagCount}个核心技能标签` : ''}
- 严格按以下JSON格式输出

目标JD：
{{jd_text}}

请按以下格式输出JSON（不要其他内容）：
{
  "summary": {
${jsonFields}
  }${includeTags ? `,
  "skillTags": ["${isEnglish ? 'skill tag 1' : '技能标签1'}", "${isEnglish ? 'skill tag 2' : '技能标签2'}"]` : ''}
}`;
}

export async function analyzeJD(
  jdText: string,
  config?: JDAnalyzerConfig
): Promise<JDAnalysisResult> {
  // 使用传入的配置或默认配置
  const analyzerConfig = config || {
    dimensions: {
      jobOverview: true,
      dailyWork: true,
      implicitRequirements: true,
      developmentProspect: true,
      skillTags: true,
      companyBackground: false,
      salaryAnalysis: false,
      interviewFocus: true,
    },
    style: 'detailed' as const,
    language: 'zh' as const,
    tagCount: 5,
    systemPrompt: '',
  };

  // 构建 Prompt
  let prompt: string;
  if (analyzerConfig.systemPrompt) {
    // 使用自定义 System Prompt，替换变量
    const dimensionsText = buildDimensionsPrompt(analyzerConfig.dimensions);
    prompt = replaceTemplateVars(analyzerConfig.systemPrompt, {
      analysis_dimensions: dimensionsText,
      tag_count: String(analyzerConfig.tagCount),
      jd_text: jdText,
    });
  } else {
    // 使用默认 Prompt
    const basePrompt = buildDefaultAnalyzePrompt(analyzerConfig);
    prompt = basePrompt.replace('{{jd_text}}', jdText);
  }

  // 确保 prompt 中包含 "json" 关键词（API 要求使用 json_object 格式时必须有这个词）
  const finalPrompt = prompt.toLowerCase().includes('json') 
    ? prompt 
    : `${prompt}\n\n重要：请以 JSON 格式输出结果。`;

  console.log('📝 Final Prompt:', finalPrompt.substring(0, 500) + '...');

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: finalPrompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content || '{}';
  console.log('🤖 AI Raw Response:', content);
  try {
    const result = JSON.parse(content);
    console.log('📊 Parsed Result:', JSON.stringify(result, null, 2));
    return {
      summary: {
        jobOverview: result.summary?.jobOverview || '',
        dailyWork: result.summary?.dailyWork || '',
        implicitRequirements: result.summary?.implicitRequirements || '',
        developmentProspect: result.summary?.developmentProspect || '',
        companyBackground: result.summary?.companyBackground || '',
        salaryAnalysis: result.summary?.salaryAnalysis || '',
        interviewFocus: result.summary?.interviewFocus || '',
      },
      skillTags: result.tags || result.skillTags || [],
    };
  } catch {
    return {
      summary: {
        jobOverview: '分析失败，请重试',
        dailyWork: '',
        implicitRequirements: '',
        developmentProspect: '',
        companyBackground: '',
        salaryAnalysis: '',
        interviewFocus: '',
      },
      skillTags: [],
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

const mockQuestions = [
  '请先简单介绍一下自己？',
  '你在这个项目中主要负责什么？',
  '能详细说一下你解决过的一个技术难题吗？',
  '你为什么想要加入我们公司？',
  '你对我们这个岗位了解多少？',
  '你在团队协作中通常扮演什么角色？',
  '你未来的职业规划是什么？',
  '你觉得自己最大的优势和不足是什么？',
  '有什么想要问我的吗？',
];

// 替换模板变量
function replaceTemplateVars(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

// 构建 System Prompt
function buildSystemPrompt(
  interviewerConfig: any,
  jdAnalysis: any,
  resume: any,
  knowledgeContext?: string
): string {
  // 格式化知识库上下文
  const knowledgeContextText = knowledgeContext
    ? `\n\n【参考知识库内容】\n${knowledgeContext}\n【参考知识库结束】\n`
    : '';

  // 如果有自定义 systemPrompt，使用它并替换变量
  if (interviewerConfig.systemPrompt) {
    const vars: Record<string, string> = {
      jd_summary: jdAnalysis ? JSON.stringify(jdAnalysis.summary || jdAnalysis) : '暂无JD信息',
      resume_summary: resume?.content || resume?.summary || '暂无简历信息',
      knowledge_context: knowledgeContextText,
    };
    return replaceTemplateVars(interviewerConfig.systemPrompt, vars);
  }

  // 默认 prompt
  return `你是一位${interviewerConfig.name}，风格${interviewerConfig.style}，语气${interviewerConfig.tone}。请根据JD和简历内容向候选人提出面试问题。${knowledgeContextText}`;
}

export async function generateInterviewQuestion(
  jdAnalysis: any,
  resume: any,
  interviewerConfig: any,
  previousMessages: any[],
  knowledgeContext?: string
): Promise<string> {
  // 模拟模式：直接返回模拟问题
  if (isMockMode) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟
    const index = Math.min(previousMessages.length / 2, mockQuestions.length - 1);
    return mockQuestions[Math.floor(index)] || mockQuestions[mockQuestions.length - 1];
  }

  const jdSummary = jdAnalysis ? JSON.stringify(jdAnalysis) : '';
  const resumeContent = resume?.content || resume?.summary || '';

  // 构建 System Prompt（使用自定义配置，包含知识库上下文）
  const systemPrompt = buildSystemPrompt(interviewerConfig, jdAnalysis, resume, knowledgeContext);

  const context = `
面试官类型：${interviewerConfig.name} (${interviewerConfig.type})
风格：${interviewerConfig.style}
语气：${interviewerConfig.tone}
提问风格：${interviewerConfig.questionStyle}

JD分析：
${jdSummary}

简历内容：
${resumeContent}

之前的对话：
${previousMessages.map(m => `${m.role}: ${m.content}`).join('\n')}
`;

  const userPrompt = `${context}

请根据JD要求和简历内容，用${interviewerConfig.questionStyle}的方式向候选人提出下一个面试问题。

要求：
1. 问题要贴合JD要求，考察候选人的实际能力
2. ${interviewerConfig.questionStyle}，根据面试官类型调整
3. 如果是第一个问题，可以从自我介绍或项目经历开始
4. 如果是后续问题，可以追问上一个回答或展开新的领域
5. 直接输出问题，不要加其他说明

请输出问题：`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || '请先介绍一下你自己？';
  } catch (error) {
    console.error('生成面试问题失败:', error);
    return '请先介绍一下你自己？';
  }
}

const mockFeedbacks = [
  { feedback: '回答得很好，思路清晰，能够突出重点。', score: 90, nextQuestion: '能具体说说你是如何协调团队资源的吗？' },
  { feedback: '回答不错，但可以更具体一些，多举一些实际例子。', score: 75, nextQuestion: '你在这个项目中遇到过什么困难？怎么解决的？' },
  { feedback: '回答比较笼统，建议结合具体案例来阐述。', score: 60, nextQuestion: '如果让你重新做这个项目，你会怎么改进？' },
  { feedback: '挺好的回答，展现了你的思考能力。', score: 85, nextQuestion: '你对未来的技术发展有什么看法？' },
  { feedback: '回答有亮点，但还需要更多实践经验支撑。', score: 70, nextQuestion: '说说你最自豪的一个项目成果吧。' },
];

export async function evaluateAnswer(
  userAnswer: string,
  lastQuestion: string,
  jdAnalysis: any,
  interviewerConfig: any,
  knowledgeContext?: string
): Promise<{
  feedback: string;
  score: number;
  nextQuestion: string;
  shouldContinue: boolean;
}> {
  // 模拟模式
  if (isMockMode) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟
    const mockIndex = Math.floor(Math.random() * mockFeedbacks.length);
    const mock = mockFeedbacks[mockIndex];
    return {
      ...mock,
      shouldContinue: true,
    };
  }

  const jdSummary = jdAnalysis ? JSON.stringify(jdAnalysis) : '';

  // 构建 System Prompt（使用自定义配置，包含知识库上下文）
  const systemPrompt = buildSystemPrompt(interviewerConfig, jdAnalysis, null, knowledgeContext);

  const userPrompt = `
面试官类型：${interviewerConfig.name} (${interviewerConfig.type})
风格：${interviewerConfig.style}
语气：${interviewerConfig.tone}

JD分析：
${jdSummary}

问题：${lastQuestion}

候选人回答：
${userAnswer}

请评估候选人的回答，要求：
1. 用${interviewerConfig.tone}的语气给出反馈
2. ${interviewerConfig.features?.giveFeedback ? '给出具体的评价和建议' : '简单确认'}
3. ${interviewerConfig.features?.correctErrors ? '指出错误并给出正确答案' : '不直接给出答案'}
4. ${interviewerConfig.features?.askFollowUps ? '根据回答提出追问' : '继续下一个话题'}
5. 给出一个0-100的评分
6. 决定是否继续面试（最多30轮）

请按以下JSON格式输出：
{
  "feedback": "你的反馈...",
  "score": 85,
  "nextQuestion": "下一个问题...",
  "shouldContinue": true
}

注意：
- feedback要自然，符合${interviewerConfig.style}的风格
- score要客观，基于回答质量
- nextQuestion可以是追问，也可以是新领域的问题
- shouldContinue在第30轮后设为false

请输出JSON：`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response');

    return JSON.parse(content);
  } catch (error) {
    console.error('评估回答失败:', error);
    return {
      feedback: '好的，我了解了。',
      score: 60,
      nextQuestion: '我们继续下一个问题...',
      shouldContinue: true,
    };
  }
}

export default openai;
