import { neon, Pool } from '@neondatabase/serverless';

let sqlClient: any = null;

function getSqlClient() {
  if (!sqlClient) {
    const connectionString = process.env.DATABASE_URL || '';
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not defined for Neon.');
    }
    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

/**
 * Proxy object for `sql` that initializes on first invocation.
 * Supports both tagged template syntax `sql`SELECT...`` and conventional queries `sql.query('SELECT...', [...])`.
 */
export const sql: any = new Proxy(
  function () {},
  {
    apply(_target, _thisArg, argArray) {
      const client = getSqlClient();
      return client(...argArray);
    },
    get(_target, prop) {
      const client = getSqlClient();
      return client[prop];
    },
  }
);

let poolInstance: Pool | null = null;

export function getNeonPool(): Pool {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL || '';
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not defined for Neon.');
    }
    poolInstance = new Pool({ connectionString });
  }
  return poolInstance;
}

export default sql;
