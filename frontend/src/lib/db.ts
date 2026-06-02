import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString: databaseUrl,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  return pool.query(text, params);
}

export async function getOrganizations(userId: string) {
  try {
    const result = await query(
      `SELECT o.id, o.name, o.slug, o."createdAt", m."createdAt" as "joinedAt"
       FROM neon_auth.organization o
       INNER JOIN neon_auth.member m ON o.id = m."organizationId"
       WHERE m."userId" = $1
       ORDER BY m."createdAt" DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('[db.getOrganizations] Error:', error);
    throw error;
  }
}
