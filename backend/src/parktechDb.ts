import { Pool, PoolClient } from 'pg';
import { config } from './config';

let parktechPool: Pool | null = null;

/**
 * Lazily create the parktech pool on first use.
 * This avoids connection errors during Vercel serverless cold start.
 */
function getPool(): Pool {
  if (!parktechPool) {
    parktechPool = new Pool({
      host: config.parktechDb.host,
      port: config.parktechDb.port,
      database: config.parktechDb.database,
      user: config.parktechDb.user,
      password: config.parktechDb.password,
      max: 3,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Enforce read-only on every new connection — NEVER write to parktech
    parktechPool.on('connect', (client: PoolClient) => {
      client.query('SET default_transaction_read_only = true');
    });

    parktechPool.on('error', (err: Error) => {
      console.error('Unexpected parktech PostgreSQL pool error:', err);
      // Reset pool so it can be recreated on next request
      parktechPool = null;
    });
  }
  return parktechPool;
}

export default getPool;
