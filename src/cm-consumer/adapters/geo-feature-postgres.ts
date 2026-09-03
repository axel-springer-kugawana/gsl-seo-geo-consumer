import { Client as PgClient } from 'pg';
import { getClassifiedApiSecret } from "./classified-api-secrets";
import { logger } from "@shared/cross-cutting/logger";
import { Geo } from '../../shared/models/geo/1.0.0/geo';

const PG_SCHEMA = 'public';

// Extra fields not present on the shared Geo model, sourced from the Geo Place API item itself.
export type GeoFeatureExtra = {
  type?: string | null;
  parentIds?: string[];
};

let cachedPgClient: PgClient | null = null;

// Reused across warm lambda invocations; reconnects lazily if the previous connection dropped.
async function getPgClient(): Promise<PgClient> {
  if (cachedPgClient) {
    return cachedPgClient;
  }

  const secrets = await getClassifiedApiSecret();
  const client = new PgClient({
    host: secrets.DbHostWriter,
    port: Number(secrets.DbPort),
    database: secrets.DbMainDatabase,
    user: secrets.DbUsername,
    password: secrets.DbPassword,
  });
  await client.connect();
  logger.info("PostgreSQL connection established for geoFeature writes");
  cachedPgClient = client;
  return client;
}

// Mirrors the DynamoDB write with an upsert on the geoFeature table used by the geo-bulk-load pipeline.
export async function persitsInSQL(geoData: Geo, extra?: GeoFeatureExtra): Promise<void> {
  const client = await getPgClient();

  logger.info("Upserting geoFeature in PostgreSQL", { geoid: geoData.AvivGeoId });

  await client.query(
    `
      INSERT INTO ${PG_SCHEMA}.geofeature (
        avivgeoid, type, mainpostalcode, countrycode, fictive, level,
        postalcodes, parents, countryid, regionid, provinceid, municipalityid, neighbors
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (avivgeoid) DO UPDATE SET
        type = EXCLUDED.type,
        mainpostalcode = EXCLUDED.mainpostalcode,
        countrycode = EXCLUDED.countrycode,
        fictive = EXCLUDED.fictive,
        level = EXCLUDED.level,
        postalcodes = EXCLUDED.postalcodes,
        parents = EXCLUDED.parents,
        countryid = EXCLUDED.countryid,
        regionid = EXCLUDED.regionid,
        provinceid = EXCLUDED.provinceid,
        municipalityid = EXCLUDED.municipalityid,
        neighbors = EXCLUDED.neighbors;
    `,
    [
      geoData.AvivGeoId,
      extra?.type ?? null,
      geoData.Code ?? null,
      geoData.CountryCode ?? null,
      geoData.IsFictive ?? false,
      geoData.Level ?? null,
      geoData.PostalCodes ?? null,
      extra?.parentIds ?? null,
      geoData.Country?.AvivGeoId ?? null,
      geoData.Region?.AvivGeoId ?? null,
      geoData.Province?.AvivGeoId ?? null,
      geoData.Municipality?.AvivGeoId ?? null,
      geoData.AvailableNeighborhoods ?? null,
    ]
  );

  logger.info("geoFeature upserted successfully in PostgreSQL", { geoid: geoData.AvivGeoId });

  //TODO : add also on geonames table

  //TODO : recalculate materized view for the geoFeature table, to keep it up to date with the new data. This is needed because the geoFeature table is used by the geo-bulk-load pipeline, and the materialized view is used by the geo-bulk-load pipeline to generate the parquet files.
}

export async function deleteGeoFeature(avivGeoId: string): Promise<void> {
  const client = await getPgClient();

  logger.info("Deleting geoFeature in PostgreSQL", { geoid: avivGeoId });

  await client.query(`DELETE FROM ${PG_SCHEMA}.geofeature WHERE avivgeoid = $1;`, [avivGeoId]);

  logger.info("geoFeature deleted successfully in PostgreSQL", { geoid: avivGeoId });

//TODO : add in lineage table


}
