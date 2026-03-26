import getPool from '../parktechDb';
import pool from '../db';

export interface ParktechCustomer {
  urn: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  is_blocked: boolean;
}

export interface EventInfo {
  event_urn: string;
  event_type: string;
  event_timestamp: string;
  outlet_urn: string;
  loyalty_scheme_slug: string;
}

export interface EventSearchResult {
  customer: ParktechCustomer;
  event: EventInfo;
  auth_user_urn: string | null;
}

/**
 * Search parktech DB by event URN.
 * Extracts customer_urn from the event.data JSON, then fetches full customer info.
 * Also cross-references with the auth DB via email to find the auth user_urn.
 *
 * ALL QUERIES ARE READ-ONLY.
 */
export async function searchByEventUrn(eventUrn: string): Promise<EventSearchResult | null> {
  // Step 1: Get event + customer from parktech DB
  const eventResult = await getPool().query(
    `SELECT
       e.urn AS event_urn,
       e.type AS event_type,
       e.timestamp AS event_timestamp,
       e.data,
       c.urn AS customer_urn,
       c.first_name,
       c.last_name,
       c.email_address,
       c.phone_number,
       c.is_blocked
     FROM event e
     JOIN customer c ON c.urn = (e.data->'customer'->>'urn')::uuid
     WHERE e.urn = $1`,
    [eventUrn]
  );

  if (eventResult.rows.length === 0) {
    return null;
  }

  const row = eventResult.rows[0];
  const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;

  const customer: ParktechCustomer = {
    urn: row.customer_urn,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    email_address: row.email_address || '',
    phone_number: row.phone_number || '',
    is_blocked: row.is_blocked || false,
  };

  const event: EventInfo = {
    event_urn: row.event_urn,
    event_type: row.event_type || '',
    event_timestamp: row.event_timestamp || '',
    outlet_urn: data?.outlet?.urn || '',
    loyalty_scheme_slug: data?.loyalty_scheme?.slug || '',
  };

  // Step 2: Try to cross-reference with auth DB via email
  let authUserUrn: string | null = null;

  if (customer.email_address) {
    const authResult = await pool.query(
      `SELECT urn FROM "user" WHERE email_address = $1 LIMIT 1`,
      [customer.email_address]
    );
    if (authResult.rows.length > 0) {
      authUserUrn = authResult.rows[0].urn;
    }
  }

  return {
    customer,
    event,
    auth_user_urn: authUserUrn,
  };
}
