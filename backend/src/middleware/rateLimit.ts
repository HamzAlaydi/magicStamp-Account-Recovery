import rateLimit from 'express-rate-limit';

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many search requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const revealLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many reveal requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
