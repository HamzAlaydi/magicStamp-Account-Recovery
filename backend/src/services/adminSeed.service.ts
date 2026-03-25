import bcrypt from 'bcryptjs';
import { config } from '../config';
import { AdminModel } from '../models/Admin';

type SeedAdmin = {
  email: string;
  password: string;
  role?: 'admin';
};

export async function seedAdminsFromEnv(): Promise<void> {
  const raw = (config.adminSeed.json || '').trim();
  if (!raw) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('ADMIN_SEED_JSON must be valid JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('ADMIN_SEED_JSON must be a JSON array');
  }

  const admins = parsed as SeedAdmin[];

  for (const admin of admins) {
    const email = String(admin.email || '').toLowerCase().trim();
    const password = String(admin.password || '');
    if (!email || !password) continue;

    const passwordHash = await bcrypt.hash(password, 10);

    await AdminModel.updateOne(
      { email },
      { $set: { email, passwordHash, role: 'admin' } },
      { upsert: true }
    );
  }
}

