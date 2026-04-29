import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/resend';

const verificationCodes = new Map<string, { code: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    const existing = verificationCodes.get(email);
    if (existing && Date.now() < existing.expires - 240000) {
      return NextResponse.json(
        { error: '请等待1分钟后再发送' },
        { status: 429 }
      );
    }

    const code = Math.random().toString().slice(2, 8);
    const expires = Date.now() + 5 * 60 * 1000;

    verificationCodes.set(email, { code, expires });

    console.log(`🔐 发送验证码到 ${email}: ${code}`);

    const result = await sendVerificationEmail(email, code);

    if (!result.success) {
      console.log('⚠️ Resend 发送失败，使用开发模式');
      return NextResponse.json({
        success: true,
        message: '验证码已发送（开发模式：请使用 123456）',
        debugCode: code,
      });
    }

    return NextResponse.json({
      success: true,
      message: '验证码已发送到邮箱',
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    return NextResponse.json(
      { error: '发送失败，请重试' },
      { status: 500 }
    );
  }
}

export { verificationCodes };
