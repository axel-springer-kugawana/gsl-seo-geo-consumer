import { createDynamoDBClient, DYNAMODB_BATCH_WRITE_LIMIT, sendBatchToDynamoDB } from "@shared/adapters/dynamodb-client";
import { getGeoApiSecret } from "./geo-api-secrets";
import { createPgClient } from "@shared/adapters/pg-client";
import { requireEnvironmentVariable } from "@shared/cross-cutting/environment";
import { GEO_DYNAMODB_SCHEMA_VERSION } from "@shared/models/geo-dynamodb-schema-version";
import { logger } from "@shared/cross-cutting/logger";
import { Geo, GeoEntityBase, GeoName } from '../shared/models/geo/1.0.0/geo';
import { GeoLineageFallbackItem } from '../models/geoManagementStructure';

const PG_SCHEMA = 'public';
const awsRegion = requireEnvironmentVariable('AWS_REGION');

type RawGeoName = { displayname?: string | null; name?: string | null; slug?: string | null; language?: string | null };

export async function processMassiveSqlToDynamoDB(): Promise<void> {
    return backupPostgresCursorToDynamoDB({
        key: 'v_geo_feature',
        dynamoTableNameEnvVar: 'GEO_DYNAMODB_TABLE_NAME',
        mapRow: mapRecordToGeo,
        declareCursorSql: (schema) => `
      SELECT
            avivgeoid, mainpostalcode, countrycode, fictive, level, postalcodes, names,
            countryid, code, countryfictive, countrynames,
            regionid, regioncode, regionfictive, regionnames,
            provinceid, provincecode, provincefictive, provincenames,
            municipalityid, municipalitycode, municipalityfictive, municipalitynames,
            boroughid, boroughcode, boroughfictive, boroughnames,
            neighborhoodid, neighborhoodcode, neighborhoodfictive, neighborhoodnames,
            microneighborhoodid, microneighborhoodcode, microneighborhoodfictive, microneighborhoodnames,
            streetid,streetcode, streetfictive, streetlevel, streetnames, streetids, population
      FROM ${schema}.v_geo_full;
    `,
    });
}

export async function processGeoLineageFallbacksToDynamoDB(): Promise<void> {
    return backupPostgresCursorToDynamoDB({
        key: 'geolineage',
        dynamoTableNameEnvVar: 'GEO_LINEAGE_DYNAMODB_TABLE_NAME',
        mapRow: mapRowGeoLineage,
        declareCursorSql: (schema) => `
      SELECT oldid,
             json_agg(jsonb_build_object('ancestor_id', g.oldid, 'descendant_id', g.newid)) AS fallbacks
      FROM ${schema}.geolineage g
      GROUP BY oldid;
    `,
    });
}

function mapRawNames(rawNames: RawGeoName[] | null): GeoName[] {
    return (rawNames ?? [])
        .filter((rawName) => rawName?.language)
        .map((rawName) => ({
            DisplayName: rawName.displayname ?? rawName.name ?? '',
            Language: rawName.language ?? '',
            Name: rawName.name ?? rawName.displayname ?? '',
            Slug: rawName.slug ?? '',
        }));
}

function mapGeoEntity(id: string | null, code: string | null, fictive: boolean | null, rawNames: RawGeoName[] | null): GeoEntityBase | undefined {
    if (!id) {
        return undefined;
    }
    return {
        AvivGeoId: id,
        Code: code ?? undefined,
        IsFictive: fictive ?? false,
        Names: mapRawNames(rawNames),
    };
}


// v_geo_full -> shared Geo model (shared/models/geo/1.0.0/geo.ts). Geo fields left unmapped
// due to no equivalent in the view: Version, Macroregion, AvailableNeighborhoods,
// ImmoweltLegacyMappings, LogicImmoLegacyMapping, NeighbouringGeoLevels, SelogerLegacyMapping,
// SurroundingMunicipalitiesIds, ttl, UpdateDate.
function mapRecordToGeo(row: Record<string, any>): Partial<Geo> {
    return {
        AvivGeoId: row.avivgeoid,
        Code: row.mainpostalcode ?? undefined,
        CountryCode: row.countrycode ?? undefined,
        IsFictive: row.fictive ?? false,
        Level: row.level ?? undefined,
        PostalCodes: row.postalcodes ?? undefined,
        Parents: row.parents ?? undefined,
        Type: row.type ?? undefined,
        Names: mapRawNames(row.names),
        Country: mapGeoEntity(row.countryid, row.code, row.countryfictive, row.countrynames),
        Region: mapGeoEntity(row.regionid, row.regioncode, row.regionfictive, row.regionnames),
        Province: mapGeoEntity(row.provinceid, row.provincecode, row.provincefictive, row.provincenames),
        Municipality: mapGeoEntity(row.municipalityid, row.municipalitycode, row.municipalityfictive, row.municipalitynames),
        Borough: mapGeoEntity(row.boroughid, row.boroughcode, row.boroughfictive, row.boroughnames),
        Neighborhood: mapGeoEntity(row.neighborhoodid, row.neighborhoodcode, row.neighborhoodfictive, row.neighborhoodnames),
        MicroNeighborhood: mapGeoEntity(row.microneighborhoodid, row.microneighborhoodcode, row.microneighborhoodfictive, row.microneighborhoodnames),
        Street: mapGeoEntity(row.streetid, row.streetcode, row.streetfictive, row.streetnames),
        StreetIds: row.streetids ?? undefined,
        AvailableNeighborhoods: row.neighbouringgeos,
        Population: row.population ?? undefined,
    };
}

// geolineage -> DynamoDB fallback item consumed by the cm-consumer lambda (see markGeoAsDeleted
// in cm-consumer/adapters/geo-materialized-view-dynamodb.ts) : AvivGeoId + list of fallbacks.
function mapRowGeoLineage(row: Record<string, any>): GeoLineageFallbackItem {
    return {
        AvivGeoId: row.oldid,
        Type: "DELETED",
        Fallbacks: row.fallbacks ?? []
    };
}

type BackupCursorToDynamoDbOptions<T> = {
    // Used in logs and to derive the SQL cursor name, to distinguish this backup from the others sharing this code path.
    key: string;
    dynamoTableNameEnvVar: string;
    declareCursorSql: (schema: string) => string;
    mapRow: (row: Record<string, any>) => T;
};

// Shared server-side-cursor -> DynamoDB batch backup: fetches rows in pages, converts them via
// mapRow, and writes them to DynamoDB in batches with retry-on-throttling.
async function backupPostgresCursorToDynamoDB<T extends Record<string, any>>(
    options: BackupCursorToDynamoDbOptions<T>
): Promise<void> {
    const { key: taskLabel, dynamoTableNameEnvVar, declareCursorSql, mapRow } = options;
    const cursorName = `${taskLabel}_cursor`;

    logger.info(`[ECS Task] Starting bulk backup of ${taskLabel} to DynamoDB...`);

    const apisecrets = await getGeoApiSecret(process.env.GEO_DB_SECRET_ID || '');
    const DYNAMODB_TABLE_NAME = requireEnvironmentVariable(dynamoTableNameEnvVar);
    const FETCH_BATCH_SIZE = Number(process.env.GEO_DYNAMODB_FETCH_BATCH_SIZE || '1000');

    logger.info(`[ECS Task] DynamoDB backup configuration (${taskLabel})`, {
        
        DYNAMODB_TABLE_NAME,
        FETCH_BATCH_SIZE,
        DYNAMODB_BATCH_WRITE_LIMIT,
    });

    const pgClient = await createPgClient(apisecrets);
    await pgClient.connect();
    logger.info('[ECS Task] PostgreSQL connection established.');

    const ddbClient = createDynamoDBClient(awsRegion);

    // Batches with retries are logged individually; the rest are only reflected in this running total,
    // to keep progress logs to one line every PROGRESS_LOG_EVERY_N_BATCHES instead of one per batch.
    const PROGRESS_LOG_EVERY_N_BATCHES = 20;
    let totalRowsProcessed = 0;
    let totalRetriedBatches = 0;
    let batchIndex = 0;
    const startedAt = Date.now();

    try {
        // Server-side cursor: avoids loading the whole result set in memory or paying the cost of an OFFSET.
        await pgClient.query('BEGIN');
        await pgClient.query(`DECLARE ${cursorName} CURSOR FOR ${declareCursorSql(PG_SCHEMA)}`);
        logger.info(`[ECS Task] Cursor ${cursorName} declared, starting batched reads.`);

        for (; ;) {
            const fetchStartedAt = Date.now();
            const result = await pgClient.query(`FETCH ${FETCH_BATCH_SIZE} FROM ${cursorName};`);
            if (result.rows.length === 0) {
                logger.info('[ECS Task] Cursor exhausted, no more rows to process.');
                break;
            }

            batchIndex += 1;
            logger.debug(`[ECS Task] Batch #${batchIndex}: ${result.rows.length} rows fetched from PostgreSQL in ${Date.now() - fetchStartedAt}ms.`);

            let batch: Record<string, any>[] = [];

            for (const row of result.rows) {
                const { ...item } = mapRow(row) as { Version?: string } & Record<string, any>;
                // 'Version' is the table's static sort key ("3.1"); drop any extra field
                // so it isn't stored redundantly alongside the sort key.
                batch.push({ ...item, Version: GEO_DYNAMODB_SCHEMA_VERSION });

                if (batch.length === DYNAMODB_BATCH_WRITE_LIMIT) {
                    await sendBatchToDynamoDB(ddbClient, DYNAMODB_TABLE_NAME, batch);
                    totalRowsProcessed += batch.length;
                    batch = [];
                }
            }

            if (batch.length > 0) {
                await sendBatchToDynamoDB(ddbClient, DYNAMODB_TABLE_NAME, batch);
                totalRowsProcessed += batch.length;
            }

            const elapsedSeconds = (Date.now() - startedAt) / 1000;
            const throughput = Math.round(totalRowsProcessed / elapsedSeconds);
            if (batchIndex % PROGRESS_LOG_EVERY_N_BATCHES === 0) {
                logger.info(`[ECS Task] Progress (${taskLabel}): ${totalRowsProcessed} rows saved in ${batchIndex} batch(es) so far (~${throughput} rows/s, ${totalRetriedBatches} chunk(s) retried).`);
            }
        }

        await pgClient.query(`CLOSE ${cursorName};`);
        await pgClient.query('COMMIT');
        logger.info(`[ECS Task] DynamoDB backup (${taskLabel}) completed successfully: ${totalRowsProcessed} rows processed in ${batchIndex} batch(es), ${totalRetriedBatches} chunk(s) needed retries, total duration ${Math.round((Date.now() - startedAt) / 1000)}s.`);
    } catch (error) {
        await pgClient.query('ROLLBACK').catch(() => undefined);
        logger.error(`[ECS Task] CRITICAL ERROR during backup to DynamoDB (${taskLabel}, after ${totalRowsProcessed} rows processed, batch #${batchIndex}, ${totalRetriedBatches} chunk(s) retried) : ${error}`);
        throw error;
    } finally {
        await pgClient.end();
        logger.info('[ECS Task] PostgreSQL connection closed.');
    }
}