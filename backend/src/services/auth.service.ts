import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { AgentPayload } from '../middleware/auth';
import { sendOtpEmail } from './email.service';
import { AdminModel } from '../models/Admin';
import { OtpModel } from '../models/Otp';
import { RegisteredUserModel } from '../models/RegisteredUser';
import { SessionModel } from '../models/Session';

async function getAdminEmails(): Promise<string[]> {
  const docs = await AdminModel.find({}, { email: 1 }).lean();
  return docs
    .map((d: any) => String(d.email || '').trim())
    .filter(Boolean);
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(email: string, code: string): string {
  return crypto
    .createHash('sha256')
    .update(`${email}:${code}:${config.jwt.secret}`)
    .digest('hex');
}

// ============ ADMIN LOGIN ============
export async function loginAdmin(
  email: string,
  password: string
): Promise<{ token: string; agent: AgentPayload } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const admin = await AdminModel.findOne({ email: normalizedEmail }).lean();
  if (!admin) return null;

  const valid = await bcrypt.compare(password, String((admin as any).passwordHash));
  if (!valid) return null;

  const agentId = String((admin as any)._id);
  const username = String((admin as any).email);

  const session = await SessionModel.create({
    agentId,
    username,
    role: 'admin',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + config.session.maxAgeMs),
  });

  const payload: AgentPayload = {
    id: agentId,
    username,
    role: 'admin',
    sessionId: String((session as any)._id),
  };

  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });

  return { token, agent: payload };
}

// ============ OTP REQUEST ============
export async function requestOtp(email: string): Promise<{ message: string; isFirstTime: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if this is an admin trying to use OTP (they should use password)
  const admin = await AdminModel.findOne({ email: normalizedEmail }).lean();
  if (admin) {
    throw new Error('Admin accounts must use password login');
  }

  const existing = await RegisteredUserModel.findOne({ email: normalizedEmail }).lean();
  const isFirstTime = !existing;
  const otp = generateOtp();

  await OtpModel.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        codeHash: hashOtp(normalizedEmail, otp),
        isFirstTime,
        expiresAt: new Date(Date.now() + config.otp.expiryMs),
      },
    },
    { upsert: true }
  );

  const adminEmails = await getAdminEmails();
  if (adminEmails.length === 0) {
    throw new Error('No admin accounts configured');
  }

  if (isFirstTime) {
    // First time: send OTP to ADMINS ONLY
    await sendOtpEmail(adminEmails, otp, normalizedEmail, true);
    return {
      message: 'OTP sent to administrators. Please contact an admin to get your access code.',
      isFirstTime: true,
    };
  } else {
    // Returning user: send OTP to user AND admins
    await sendOtpEmail([normalizedEmail, ...adminEmails], otp, normalizedEmail, false);
    return {
      message: 'OTP sent to your email. Check your inbox.',
      isFirstTime: false,
    };
  }
}

// ============ OTP VERIFICATION ============
export async function verifyOtp(
  email: string,
  code: string
): Promise<{ token: string; agent: AgentPayload } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const record = await OtpModel.findOne({ email: normalizedEmail }).lean();

  if (!record) return null;
  if (new Date() > new Date((record as any).expiresAt)) {
    await OtpModel.deleteOne({ email: normalizedEmail });
    return null;
  }
  if (String((record as any).codeHash) !== hashOtp(normalizedEmail, code)) return null;

  // OTP valid — delete it (one-time use)
  await OtpModel.deleteOne({ email: normalizedEmail });

  // Register user if first time
  await RegisteredUserModel.updateOne(
    { email: normalizedEmail },
    { $setOnInsert: { email: normalizedEmail, firstLoginAt: new Date() } },
    { upsert: true }
  );

  const agentId = `user-${normalizedEmail}`;
  const username = normalizedEmail;

  const session = await SessionModel.create({
    agentId,
    username,
    role: 'support',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + config.session.maxAgeMs),
  });

  const payload: AgentPayload = {
    id: agentId,
    username,
    role: 'support',
    sessionId: String((session as any)._id),
  };

  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });

  return { token, agent: payload };
}

// ============ HELPERS ============
export async function isAdmin(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const admin = await AdminModel.findOne({ email: normalizedEmail }).lean();
  return Boolean(admin);
}
