import pool from '../db';

export interface UserResult {
  urn: string;
  first_name: string;
  last_name: string;
  email_address: string;
  email_verified: boolean;
  created: string;
  modified: string;
}

export interface IdentityResult {
  urn: string;
  auth_id: string;
  provider: string;
}

export interface UserDetail {
  user: UserResult;
  identities: IdentityResult[];
}

export async function searchUsers(query: string, limit: number = 20): Promise<(UserResult & { phone: string; provider: string })[]> {
  const searchPattern = `%${query}%`;
  const result = await pool.query(
    `SELECT u.urn, u.first_name, u.last_name, u.email_address, u.email_verified,
            u.created, u.modified,
            i.auth_id AS phone, i.provider
     FROM "user" u
     LEFT JOIN identity i ON i.user_urn = u.urn AND i.provider = 'twilio_phone_number'
     WHERE u.email_address ILIKE $1
        OR u.first_name ILIKE $1
        OR u.last_name ILIKE $1
     LIMIT $2`,
    [searchPattern, limit]
  );

  return result.rows.map((row: any) => ({
    urn: row.urn,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    email_address: row.email_address || '',
    email_verified: row.email_verified ?? false,
    created: row.created || '',
    modified: row.modified || '',
    phone: row.phone || '',
    provider: row.provider || '',
  }));
}

/**
 * Search by phone number in the identity table.
 * Returns the user(s) that own identities matching the phone query.
 */
export async function searchByPhone(query: string, searchType: 'phone' | 'magic' = 'phone', limit: number = 20): Promise<(UserResult & { phone: string; createdAt: string; provider: string })[]> {
  let searchCondition = '';
  const params: any[] = [limit];

  if (searchType === 'phone') {
    // Strip leading zeros for international matching flexibility
    const cleanPhone = query.replace(/^0+/, '');
    params.push(`%${cleanPhone}%`);
    searchCondition = `i.auth_id::text ILIKE $2`;
  } else {
    // Magic ID (urn)
    params.push(`${query}%`);
    searchCondition = `CAST(u.urn AS text) ILIKE $2`;
  }

  const result = await pool.query(
    `SELECT u.urn, u.first_name, u.last_name, u.email_address, u.email_verified,
            u.created AS user_created, u.modified AS user_modified,
            i.auth_id as phone, i.created, i.provider
     FROM identity i
     JOIN "user" u ON u.urn = i.user_urn
     WHERE ${searchCondition}
     LIMIT $1`,
    params
  );

  return result.rows.map((row: any) => ({
    urn: row.urn,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    email_address: row.email_address || '',
    email_verified: row.email_verified ?? false,
    created: row.user_created || '',
    modified: row.user_modified || '',
    phone: row.phone || '',
    createdAt: row.created || '',
    provider: row.provider || '',
  }));
}

export async function getUserDetails(urn: string): Promise<UserDetail | null> {
  const userResult = await pool.query(
    `SELECT urn, first_name, last_name, email_address, email_verified, created, modified
     FROM "user"
     WHERE urn = $1`,
    [urn]
  );

  if (userResult.rows.length === 0) return null;

  const user = userResult.rows[0];

  const identityResult = await pool.query(
    `SELECT urn, auth_id, provider
     FROM identity
     WHERE user_urn = $1`,
    [urn]
  );

  const identities: IdentityResult[] = identityResult.rows.map((row: any) => ({
    urn: row.urn,
    auth_id: row.auth_id,
    provider: row.provider,
  }));

  return {
    user: {
      urn: user.urn,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email_address: user.email_address || '',
      email_verified: user.email_verified ?? false,
      created: user.created || '',
      modified: user.modified || '',
    },
    identities,
  };
}

export async function getPhoneForUser(urn: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT auth_id
     FROM identity
     WHERE user_urn = $1
       AND provider = 'twilio_phone_number'`,
    [urn]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0].auth_id;
}

export async function verifyUserData(
  urn: string,
  answers: { email?: string; firstName?: string; lastName?: string }
): Promise<{ verified: boolean; checks: { field: string; passed: boolean }[] }> {
  const userResult = await pool.query(
    `SELECT first_name, last_name, email_address
     FROM "user"
     WHERE urn = $1`,
    [urn]
  );

  if (userResult.rows.length === 0) {
    return { verified: false, checks: [] };
  }

  const user = userResult.rows[0];
  const checks: { field: string; passed: boolean }[] = [];

  if (answers.email !== undefined) {
    checks.push({
      field: 'email',
      passed: user.email_address?.toLowerCase() === answers.email.toLowerCase(),
    });
  }

  if (answers.firstName !== undefined) {
    checks.push({
      field: 'firstName',
      passed: user.first_name?.toLowerCase() === answers.firstName.toLowerCase(),
    });
  }

  if (answers.lastName !== undefined) {
    checks.push({
      field: 'lastName',
      passed: user.last_name?.toLowerCase() === answers.lastName.toLowerCase(),
    });
  }

  const verified = checks.length >= 2 && checks.every((c) => c.passed);

  return { verified, checks };
}
