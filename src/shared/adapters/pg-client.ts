import { Client as PgClient } from 'pg';
import type { GeoSSOTSecret } from '@shared/models/geo-ssot-secret';

export function createPgClient(secrets: GeoSSOTSecret): Promise<PgClient> {
  // Without this, a secret missing DbHostWriter/DbPort silently falls back to pg's
  // defaults (localhost:5432), producing a confusing "ECONNREFUSED 127.0.0.1:5432"
  // instead of pointing at the real cause (wrong/incomplete secret).
  if (!secrets.DbHostWriter || !secrets.DbPort) {
    throw new Error('createPgClient: secret is missing DbHostWriter/DbPort, refusing to fall back to localhost:5432');
  }

  const pgClient = new PgClient({
    host: secrets.DbHostWriter,
    port: Number(secrets.DbPort),
    database: secrets.DbMainDatabase,
    user: secrets.DbUsername,
    password: secrets.DbPassword,
  });
  return Promise.resolve(pgClient);
}

