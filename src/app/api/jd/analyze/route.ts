import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, jdText } = body;
    const content = jdText || text;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '请提供岗位描述' },
        { status: 400 }
      );
    }

    // 模拟 LLM 分析（实际开发中调用 OpenAI API）
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 模拟分析结果
    const result = {
      overview: `这是一个Java后端开发岗位，主要负责业务系统的开发和维护。\n\n从岗位描述来看，需要候选人具备扎实的Java基础和后端开发经验。\n\n工作内容包括：\n• 系统架构设计与开发\n• 代码质量把控\n• 性能优化`,
      requirements: `除了JD中明确列出的技术要求外，还隐含了以下能力：\n\n• 熟悉微服务架构\n• 了解分布式系统原理\n• 具备良好的沟通能力\n• 有一定的项目经验和技术视野`,
      daily: `日常工作内容大致如下：\n\n1️⃣ 需求分析与技术方案设计\n2️⃣ 功能开发与单元测试\n3️⃣ 代码评审与优化\n4️⃣ 线上问题排查\n5️⃣ 技术文档编写`,
      prospects: `这个岗位的发展前景很好！\n\n• 技术路线：高级工程师 → 技术专家 → 架构师\n• 管理路线：技术主管 → 技术经理 → 技术总监\n• 可以往业务架构、系统架构、数据架构等方向深入发展`,
    };

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error('JD 分析失败:', error);
    return NextResponse.json(
      { error: '分析失败，请重试' },
      { status: 500 }
    );
  }
}
