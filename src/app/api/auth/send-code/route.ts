import { NextResponse } from 'next/server';

// 内存存储验证码
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '请输入邮箱地址' }, { status: 400 });
    }

    // 生成 6 位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 分钟后过期

    verificationCodes.set(email, { code, expiresAt });

    console.log(`📧 验证码已生成: ${email} -> ${code}`);

    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      code, // 开发阶段返回验证码，生产环境删除
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    return NextResponse.json(
      { error: '发送失败，请重试' },
      { status: 500 }
    );
  }
}
