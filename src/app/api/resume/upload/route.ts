import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string;

    if (!file && !text) {
      return NextResponse.json(
        { error: '请上传文件或粘贴简历内容' },
        { status: 400 }
      );
    }

    // 模拟简历解析（实际开发中调用文件解析库）
    let resumeContent = text || '';
    let filename = '直接粘贴';

    if (file) {
      filename = file.name;
      
      // 模拟文件解析
      resumeContent = `
姓名：张三
邮箱：zhangsan@example.com
电话：13800138000

教育背景：
- 北京大学 计算机科学与技术 本科 2018-2022

工作经验：
- 字节跳动 Java后端开发工程师 2022-至今
  • 负责电商系统后端开发
  • 参与系统重构，性能提升30%
  • 使用技术栈：Spring Boot, MySQL, Redis, Kafka

技能：
- Java, Python
- Spring Boot, Spring Cloud
- MySQL, Redis, MongoDB
- Kafka, RabbitMQ
      `.trim();
    }

    return NextResponse.json({
      success: true,
      content: resumeContent,
      filename: filename,
    });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: error.message || '简历解析失败' },
      { status: 500 }
    );
  }
}
