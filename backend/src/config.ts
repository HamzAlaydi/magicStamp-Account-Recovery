import dotenv from 'dotenv';
dotenv.config();

export const config = {
  db: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'auth',
    user: process.env.DATABASE_USER || 'parktech',
    password: process.env.DATABASE_PASSWORD || '',
  },
  mongo: {
    uri: process.env.MONGODB_URI || '',
  },
  adminSeed: {
    /**
     * JSON array of admins to upsert into Mongo on boot.
     * Example:
     * [{"email":"admin@example.com","password":"change-me","role":"admin"}]
     */
    json: process.env.ADMIN_SEED_JSON || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    expiresIn: '8h',
  },
  session: {
    maxAgeMs: 8 * 60 * 60 * 1000, // 8 hours hard cap
  },
  port: parseInt(process.env.PORT || '3001'),
  smtp: {
    host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@recoverdashboard.local',
  },
  otp: {
    expiryMs: 6 * 60 * 60 * 1000, // 6 hours
    length: 6,
  },
};
