import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { SessionModel } from '../models/Session';

export interface AgentPayload {
  id: string;
  username: string;
  role: 'admin' | 'support';
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      agent?: AgentPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AgentPayload;

    if (!decoded.sessionId) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    void (async () => {
      const session = await SessionModel.findOne({
        _id: decoded.sessionId,
        agentId: decoded.id,
        role: decoded.role,
        revokedAt: { $exists: false },
      }).lean();
      if (!session) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      const expiresAt = new Date((session as any).expiresAt);
      if (new Date() >= expiresAt) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      req.agent = decoded;
      next();
    })().catch((err) => {
      console.error('Auth session validation error:', err);
      res.status(401).json({ error: 'Invalid or expired token' });
    });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
