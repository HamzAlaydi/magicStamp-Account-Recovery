import { Pool } from 'pg';
import { config } from './config';

const parktechPool = new Pool({
  host: config.parktechDb.host,
  port: config.parktechDb.port,
  database: config.parktechDb.database,
  user: config.parktechDb.user,
  password: config.parktechDb.password,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Enforce read-only on every new connection — NEVER write to parktech
parktechPool.on('connect', (client) => {
  client.query('SET default_transaction_read_only = true');
});

parktechPool.on('error', (err) => {
  console.error('Unexpected parktech PostgreSQL pool error:', err);
});

export default parktechPool;
