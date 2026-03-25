import { Router, Request, Response } from 'express';
import { searchUsers, searchByPhone, getUserDetails, getPhoneForUser, verifyUserData } from '../services/user.service';
import { logAction } from '../services/audit.service';

const router = Router();

// In-memory verification state: Map<`${agentId}:${userUrn}`, boolean>
const verificationState = new Map<string, boolean>();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim();
    const mode = (req.query.mode as string || 'name').trim(); // 'name' or 'phone'

    if (!query || query.length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }

    let users;
    if (mode === 'phone' || mode === 'magic') {
      users = await searchByPhone(query, mode as 'phone' | 'magic');
    } else {
      users = await searchUsers(query);
    }

    logAction({
      agentId: req.agent!.id,
      agentUsername: req.agent!.username,
      action: 'search',
      details: `[${mode}] Query: "${query}" — ${users.length} results`,
    });

    res.json({ users });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:urn', async (req: Request, res: Response) => {
  try {
    const { urn } = req.params;
    const details = await getUserDetails(urn);

    if (!details) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    logAction({
      agentId: req.agent!.id,
      agentUsername: req.agent!.username,
      action: 'view_user',
      target: urn,
      details: `Viewed user: ${details.user.first_name} ${details.user.last_name}`,
    });

    res.json({
      user: details.user,
      identities: details.identities,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:urn/verify', async (req: Request, res: Response) => {
  try {
    const { urn } = req.params;
    const { email, firstName, lastName } = req.body;

    const result = await verifyUserData(urn, { email, firstName, lastName });

    const stateKey = `${req.agent!.id}:${urn}`;
    if (result.verified) {
      verificationState.set(stateKey, true);
      setTimeout(() => verificationState.delete(stateKey), 10 * 60 * 1000);
    }

    logAction({
      agentId: req.agent!.id,
      agentUsername: req.agent!.username,
      action: 'verify_user',
      target: urn,
      details: `Verification ${result.verified ? 'PASSED' : 'FAILED'} — checks: ${JSON.stringify(result.checks)}`,
    });

    res.json({
      verified: result.verified,
      checks: result.checks,
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:urn/reveal-phone', async (req: Request, res: Response) => {
  try {
    const { urn } = req.params;
    const stateKey = `${req.agent!.id}:${urn}`;

    if (!verificationState.get(stateKey)) {
      res.status(403).json({ error: 'User verification required before revealing phone number' });
      return;
    }

    const phone = await getPhoneForUser(urn);
    if (!phone) {
      res.status(404).json({ error: 'No phone number found for this user' });
      return;
    }

    logAction({
      agentId: req.agent!.id,
      agentUsername: req.agent!.username,
      action: 'reveal_phone',
      target: urn,
      details: `Revealed phone for user`,
    });

    verificationState.delete(stateKey);

    res.json({ phone });
  } catch (err) {
    console.error('Reveal phone error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
