import { Client as PgClient } from 'pg';
import type { GeoSSOTSecret } from '@shared/models/geo-ssot-secret';

export function createPgClient(secrets: GeoSSOTSecret): Promise<PgClient> {
  const pgClient = new PgClient({
    host: secrets.DbHostWriter,
    port: Number(secrets.DbPort),
    database: secrets.DbMainDatabase,
    user: secrets.DbUsername,
    password: secrets.DbPassword,
  });
  return Promise.resolve(pgClient);
}
