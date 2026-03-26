import { Router, Request, Response } from 'express';
import { searchByEventUrn } from '../services/parktech.service';
import { logAction } from '../services/audit.service';

const router = Router();

/**
 * GET /api/parktech/search?eventUrn=<uuid>
 * Search parktech DB by event URN to find associated customer and auth user.
 * READ-ONLY — no writes performed.
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const eventUrn = (req.query.eventUrn as string || '').trim();

    if (!eventUrn || eventUrn.length < 8) {
      res.status(400).json({ error: 'Event URN must be at least 8 characters' });
      return;
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventUrn)) {
      res.status(400).json({ error: 'Invalid Event URN format. Must be a valid UUID.' });
      return;
    }

    const result = await searchByEventUrn(eventUrn);

    logAction({
      agentId: req.agent!.id,
      agentUsername: req.agent!.username,
      action: 'search',
      details: `[event] Event URN: "${eventUrn}" — ${result ? '1 result' : '0 results'}`,
    });

    if (!result) {
      res.json({ users: [], event: null });
      return;
    }

    // Map the result into the same UserRow shape the frontend expects
    const users = [{
      urn: result.auth_user_urn || result.customer.urn,
      first_name: result.customer.first_name,
      last_name: result.customer.last_name,
      email_address: result.customer.email_address,
      phone: result.customer.phone_number,
      customer_urn: result.customer.urn,
      event_type: result.event.event_type,
      event_timestamp: result.event.event_timestamp,
      outlet_urn: result.event.outlet_urn,
      loyalty_scheme_slug: result.event.loyalty_scheme_slug,
      is_blocked: result.customer.is_blocked,
      has_auth_user: !!result.auth_user_urn,
    }];

    res.json({ users, event: result.event });
  } catch (err) {
    console.error('Parktech event search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
