import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'ai-interview-assistant-secret-key-2024';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: '请输入邮箱和验证码' },
        { status: 400 }
      );
    }

    // 验证验证码
    const storedCode = request.headers.get('x-stored-code') || '123456'; // 开发阶段默认
    const isValid = code === '123456' || code === storedCode;

    if (!isValid) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    // 生成 JWT token
    const token = jwt.sign(
      { email, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }, // 7天过期
      JWT_SECRET
    );

    // 从邮箱提取用户名
    const name = email.split('@')[0];

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: Date.now().toString(),
        email,
        name,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      },
    });
  } catch (error) {
    console.error('验证失败:', error);
    return NextResponse.json(
      { error: '验证失败，请重试' },
      { status: 500 }
    );
  }
}
