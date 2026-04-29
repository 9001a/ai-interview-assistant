import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  to: string, 
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@your-domain.com',
      to: [to],
      subject: '【AI求职助手】验证码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #F5A623 0%, #FF9500 100%); padding: 30px; text-align: center; border-radius: 12px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AI求职全链路助手</h1>
          </div>
          <div style="padding: 30px; background: #FFF8E7; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #5C4A32; margin-bottom: 20px;">
              你好！感谢使用 AI求职助手，请使用以下验证码完成登录：
            </p>
            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; border: 2px dashed #F5A623;">
              <span style="font-size: 32px; font-weight: bold; color: #F5A623; letter-spacing: 10px;">
                ${code}
              </span>
            </div>
            <p style="font-size: 14px; color: #8B7355; margin-top: 20px;">
              验证码 5 分钟内有效，请尽快使用。
            </p>
            <p style="font-size: 12px; color: #A69585; margin-top: 20px;">
              如果这不是你本人的操作，请忽略此邮件。
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend 发送失败:', error);
      return { success: false, error: error.message };
    }

    console.log('📧 验证码邮件已发送:', data);
    return { success: true };
  } catch (err) {
    console.error('发送邮件异常:', err);
    return { success: false, error: '邮件发送失败' };
  }
}
