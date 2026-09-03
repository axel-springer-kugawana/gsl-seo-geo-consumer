import { Client as PgClient } from 'pg';
import { getClassifiedApiSecret } from "./classified-api-secrets";
import { logger } from "@shared/cross-cutting/logger";
import { createPgClient } from "@shared/adapters/pg-client";
import { Geo } from '../../shared/models/geo/1.0.0/geo';
import { GeoLineageFallbackItem } from '@models';

const PG_SCHEMA = 'public';

 
let cachedPgClient: PgClient | null = null;
 
// Mirrors the DynamoDB write with an upsert on the geoFeature table used by the geo-bulk-load pipeline.
export async function persistGeoFeatureInSQL(geoData: Geo): Promise<void> {
  const client = await getPgClient();
 
 
  await client.query(
    `
      INSERT INTO ${PG_SCHEMA}.geofeature (
        avivgeoid, type, mainpostalcode, countrycode, fictive, level,
        postalcodes, parents, countryid, regionid, provinceid, municipalityid, streetids, neighbors
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
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
        streetids = EXCLUDED.streetids,
        neighbors = EXCLUDED.neighbors;
    `,
    [
      geoData.AvivGeoId,
      geoData.Type ?? null,
      geoData.Code ?? null,
      geoData.CountryCode ?? null,
      geoData.IsFictive ?? false,
      geoData.Level ?? null,
      geoData.PostalCodes ?? null,
      geoData.Parents ?? null,
      geoData.Country?.AvivGeoId ?? null,
      geoData.Region?.AvivGeoId ?? null,
      geoData.Province?.AvivGeoId ?? null,
      geoData.Municipality?.AvivGeoId ?? null,
      geoData.StreetIds,
      geoData.AvailableNeighborhoods ?? null,
    ]
  );

  logger.info("geoFeature upserted successfully in PostgreSQL", { geoid: geoData.AvivGeoId });
}

// mv_geofeature_names backs v_geo_full (used by geo-bulk-load); refresh it after each write so it stays current.
export async function refreshMaterializedView(): Promise<void> {
  const client = await getPgClient();

  logger.info("Refreshing mv_geofeature_names materialized view");

  try {
    await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${PG_SCHEMA}.mv_geofeature_names;`);
  } catch (error) {
    logger.warn("CONCURRENTLY refresh failed, falling back to standard refresh", {
      error: error instanceof Error ? error.message : String(error),
    });
    await client.query(`REFRESH MATERIALIZED VIEW ${PG_SCHEMA}.mv_geofeature_names;`);
  }

  logger.info("mv_geofeature_names refreshed successfully");
}

// Mirrors the DynamoDB Names with an upsert per language on the geoName table used by the geo-bulk-load pipeline.
export async function persistGeoNamesInSQL(geoData: Geo): Promise<void> {
  const client = await getPgClient();
  const names = geoData.Names ?? [];

  if (names.length === 0) {
    return;
  }

  logger.info("Upserting geoNames in PostgreSQL", { geoid: geoData.AvivGeoId, count: names.length });

  await client.query(
    `
      INSERT INTO ${PG_SCHEMA}.geoname (avivgeoid, language, displayname, name, slug)
      SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::text[])
      ON CONFLICT (avivgeoid, language) DO UPDATE SET
        displayname = EXCLUDED.displayname,
        name = EXCLUDED.name,
        slug = EXCLUDED.slug;
    `,
    [
      names.map(() => geoData.AvivGeoId),
      names.map((name) => name.Language),
      names.map((name) => name.DisplayName),
      names.map((name) => name.Name),
      names.map((name) => name.Slug),
    ]
  );

  logger.info("geoNames upserted successfully in PostgreSQL", { geoid: geoData.AvivGeoId, count: names.length });
}

export async function deleteGeoFeature(avivGeoId: string): Promise<void> {
  const client = await getPgClient();

  logger.info("Deleting geoFeature in PostgreSQL", { geoid: avivGeoId });

  await client.query(`DELETE FROM ${PG_SCHEMA}.geofeature WHERE avivgeoid = $1;`, [avivGeoId]);

  logger.info("geoFeature deleted successfully in PostgreSQL", { geoid: avivGeoId });

//TODO : add in lineage table

}

// Reused across warm lambda invocations; reconnects lazily if the previous connection dropped.
async function getPgClient(): Promise<PgClient> {
  if (cachedPgClient) {
    return cachedPgClient;
  }

  const secrets = await getClassifiedApiSecret();
  const client = await createPgClient(secrets);
  await client.connect();
  logger.info("PostgreSQL connection established for geoFeature writes");
  cachedPgClient = client;
  return client;
}
// Mirrors the DynamoDB Fallbacks with an upsert into the geoLineage table used by the geo-bulk-load pipeline.
export async function persistGeoLineageInSQL(geoData: GeoLineageFallbackItem): Promise<void> {
  const client = await getPgClient();
  const fallbacks = geoData.Fallbacks ?? [];

  if (fallbacks.length === 0) {
    return;
  }

  logger.info("Upserting geoLineage in PostgreSQL", { geoid: geoData.AvivGeoId, count: fallbacks.length });

  await client.query(
    `
      INSERT INTO ${PG_SCHEMA}.geolineage (newid, oldid)
      SELECT * FROM UNNEST($1::text[], $2::text[])
      ON CONFLICT (newid, oldid) DO NOTHING;
    `,
    [
      fallbacks.map((fallback) => fallback.descendant_id),
      fallbacks.map((fallback) => fallback.ancestor_id),
    ]
  );

  logger.info("geoLineage upserted successfully in PostgreSQL", { geoid: geoData.AvivGeoId, count: fallbacks.length });
}