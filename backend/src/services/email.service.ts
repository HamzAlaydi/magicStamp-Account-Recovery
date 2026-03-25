import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (config.smtp.user && config.smtp.pass) {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    } else {
      // Development: log to console instead of sending emails
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
      });
    }
  }
  return transporter;
}

export async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  const recipientList = (Array.isArray(to) ? to : [to])
    .map((r) => String(r || '').trim())
    .filter(Boolean);

  // Always log to console as backup
  console.log(`\n📧 ===== EMAIL =====`);
  console.log(`   To: ${recipientList.join(', ')}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body: ${html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200)}`);
  console.log(`   ====================\n`);

  if (recipientList.length === 0) return;
  if (!config.smtp.user || !config.smtp.pass) return;

  // Send to each recipient individually (handles Resend free-tier limitation)
  for (const recipient of recipientList) {
    try {
      await getTransporter().sendMail({
        from: `"Account Recovery Dashboard" <${config.smtp.from}>`,
        to: recipient,
        subject,
        html,
      });
      console.log(`[EMAIL] ✅ Sent to ${recipient}`);
    } catch (err: any) {
      console.warn(`[EMAIL] ⚠️ Failed to send to ${recipient}: ${err.message || err}`);
    }
  }
}

export async function sendOtpEmail(to: string | string[], otp: string, requesterEmail: string, isFirstTime: boolean): Promise<void> {
  const subject = `🔐 OTP for Account Recovery Dashboard`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0ea5e9;">Account Recovery Dashboard</h2>
      <p>An OTP has been requested ${isFirstTime ? 'for a new user' : 'for login'} by: <strong>${requesterEmail}</strong></p>
      <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Your One-Time Password</p>
        <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0ea5e9;">${otp}</p>
      </div>
      <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>6 hours</strong>. Do not share it with unauthorized users.</p>
      ${isFirstTime ? '<p style="color: #f59e0b; font-size: 13px;">⚠️ This is a first-time user. Please verify their identity before sharing this OTP.</p>' : ''}
    </div>
  `;
  await sendEmail(to, subject, html);
}
