import express from 'express';
import cors from 'cors';
import { config } from './config';
import { connectMongo } from './mongo';
import { authMiddleware } from './middleware/auth';
import { searchLimiter, revealLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import auditRoutes from './routes/audit.routes';
import { seedAdminsFromEnv } from './services/adminSeed.service';

const app = express();

// Global middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    // Allow any origin from vercel.app or localhost
    if (origin.endsWith('.vercel.app') || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply stricter rate limit to reveal endpoint
app.use('/api/users/:urn/reveal-phone', revealLimiter);

// Lazy connect for MongoDB for serverless environments
app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    console.error('MongoDB connection error in request:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Auth routes (no auth middleware needed for login)
app.use('/api/auth', authRoutes);

// Protected routes (applied after lazy connect)
app.use('/api/users', authMiddleware, searchLimiter, userRoutes);
app.use('/api/audit', authMiddleware, auditRoutes);

// Export for Vercel
export default app;

// Start server locally if not in production (e.g., Vercel)
if (process.env.NODE_ENV !== 'production') {
  async function start(): Promise<void> {
    await connectMongo(); // Connect for local server startup
    try {
      await seedAdminsFromEnv();
    } catch(err) {
      console.error('Seed admins error', err);
    }

    app.listen(config.port, () => {
      console.log(`\n🔒 Account Recovery Dashboard API`);
      console.log(`   Running on http://localhost:${config.port}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  }

  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
