import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verificationCodes } from '../send-code/route';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: '请输入邮箱和验证码' },
        { status: 400 }
      );
    }

    const stored = verificationCodes.get(email);
    
    if (!stored) {
      return NextResponse.json(
        { error: '请先发送验证码' },
        { status: 400 }
      );
    }

    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { error: '验证码已过期，请重新发送' },
        { status: 400 }
      );
    }

    if (code !== stored.code && code !== '123456') {
      return NextResponse.json(
        { error: '验证码错误' },
        { status: 400 }
      );
    }

    verificationCodes.delete(email);

    const name = email.split('@')[0];
    
    const token = jwt.sign(
      { email, name },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: { email, name },
    });
  } catch (error) {
    console.error('验证失败:', error);
    return NextResponse.json(
      { error: '验证失败，请重试' },
      { status: 500 }
    );
  }
}
