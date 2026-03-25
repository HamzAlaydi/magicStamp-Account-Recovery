import { Router, Request, Response } from 'express';
import { loginAdmin, requestOtp, verifyOtp } from '../services/auth.service';
import { logAction } from '../services/audit.service';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { SessionModel } from '../models/Session';

const router = Router();

// Admin login with email + password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await loginAdmin(email, password);
    if (!result) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    logAction({
      agentId: result.agent.id,
      agentUsername: result.agent.username,
      action: 'login',
      details: 'Admin logged in via password',
    });

    res.json({
      token: result.token,
      agent: result.agent,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request OTP for user login
router.post('/request-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const result = await requestOtp(email);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Admin accounts must use password login') {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Request OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: 'Email and OTP code are required' });
      return;
    }

    const result = await verifyOtp(email, code);
    if (!result) {
      res.status(401).json({ error: 'Invalid or expired OTP' });
      return;
    }

    logAction({
      agentId: result.agent.id,
      agentUsername: result.agent.username,
      action: 'login',
      details: 'User logged in via OTP',
    });

    res.json({
      token: result.token,
      agent: result.agent,
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current agent info
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ agent: req.agent });
});

// Logout current session
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    await SessionModel.updateOne(
      { _id: req.agent!.sessionId },
      { $set: { revokedAt: new Date() } }
    );

    logAction({
      agentId: req.agent!.id,
      agentUsername: req.agent!.username,
      action: 'login',
      details: 'Logged out',
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: revoke all sessions for an agentId (or yourself if omitted)
router.post('/logout-all', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const targetAgentId = (req.body?.agentId as string | undefined) || req.agent!.id;
    const result = await SessionModel.updateMany(
      { agentId: targetAgentId },
      { $set: { revokedAt: new Date() } }
    );
    res.json({ ok: true, revoked: result.modifiedCount });
  } catch (err) {
    console.error('Logout-all error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
