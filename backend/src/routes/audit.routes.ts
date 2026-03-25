import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/rbac';
import { getAuditLog } from '../services/audit.service';

const router = Router();

router.get('/', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await getAuditLog(page, limit);
    res.json(result);
  } catch (err) {
    console.error('Audit log fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
