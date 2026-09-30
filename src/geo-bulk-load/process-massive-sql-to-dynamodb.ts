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

export async function processGeoFeatureToDynamoDB(): Promise<void> {
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

export async function pgGeoLineageToDynamoDB(): Promise<void> {
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

export async function pgGeoLinkToDynamoDB(): Promise<void> {
    return backupPostgresCursorToDynamoDB({
        key: 'geolink',
        dynamoTableNameEnvVar: 'GEO_LINK_DYNAMODB_TABLE_NAME',
        mapRow: mapRowGeoLink,
        declareCursorSql: (schema) => `
      SELECT type, leftid, rightids
      FROM ${schema}.geolink;
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

// geolink -> DynamoDB item keyed by AvivGeoId (LEFT_ID) + Type, holding the linked ids (RIGHT_IDs).
function mapRowGeoLink(row: Record<string, any>): { AvivGeoId: string; Type: string; AvivGeoIds: string[] } {
    return {
        AvivGeoId: row.leftid,
        Type: row.type,
        AvivGeoIds: row.rightids ?? [],
    };
}

type BackupCursorToDynamoDbOptions<T> = {
    // Used in logs and to derive the SQL cursor name, to distinguish this backup from the others sharing this code path.
    key: string;
    dynamoTableNameEnvVar: string;
    declareCursorSql: (schema: string) => string;
    mapRow: (row: Record<string, any>) => T;
};

const PROGRESS_LOG_EVERY_N_PAGES = 20;

// Shared server-side-cursor -> DynamoDB batch backup. The next page is fetched from PostgreSQL while
// the current one is written, and each page is written as parallel BatchWriteItem calls
// (GEO_DYNAMODB_WRITE_CONCURRENCY in flight), each retrying unprocessed items/throttling.
async function backupPostgresCursorToDynamoDB<T extends Record<string, any>>(
    options: BackupCursorToDynamoDbOptions<T>
): Promise<void> {
    const { key: taskLabel, dynamoTableNameEnvVar, declareCursorSql, mapRow } = options;
    const cursorName = `${taskLabel}_cursor`;
    const tableName = requireEnvironmentVariable(dynamoTableNameEnvVar);
    const fetchSize = Number(process.env.GEO_DYNAMODB_FETCH_BATCH_SIZE || '1000');
    const writeConcurrency = Number(process.env.GEO_DYNAMODB_WRITE_CONCURRENCY || '16');

    logger.info(`[ECS Task] Starting bulk backup of ${taskLabel} to DynamoDB...`, { tableName, fetchSize, writeConcurrency });

    const pgClient = await createPgClient(await getGeoApiSecret(process.env.GEO_DB_SECRET_ID || ''));
    await pgClient.connect();
    const ddbClient = createDynamoDBClient(awsRegion);

    const startedAt = Date.now();
    let totalRows = 0;
    let totalRetries = 0;
    let pageIndex = 0;
    let windowStartedAt = startedAt;
    let windowRows = 0;
    let windowWaitFetchMs = 0;
    let windowWriteMs = 0;

    const fetchPage = () => pgClient.query(`FETCH ${fetchSize} FROM ${cursorName};`).then((result) => result.rows);
    let nextPage: Promise<Record<string, any>[]> | undefined;

    try {
        // Server-side cursor: avoids loading the whole result set in memory or paying the cost of an OFFSET.
        await pgClient.query('BEGIN');
        await pgClient.query(`DECLARE ${cursorName} CURSOR FOR ${declareCursorSql(PG_SCHEMA)}`);

        nextPage = fetchPage();
        for (; ;) {
            const waitStartedAt = Date.now();
            const rows = await nextPage;
            windowWaitFetchMs += Date.now() - waitStartedAt;
            if (rows.length === 0) {
                break;
            }
            // Prefetch the next page while this one is written to DynamoDB.
            nextPage = fetchPage();
            pageIndex += 1;

            // 'Version' is the table's static sort key, overriding any value coming from mapRow.
            const items = rows.map((row) => ({ ...mapRow(row), Version: GEO_DYNAMODB_SCHEMA_VERSION }));
            const writeStartedAt = Date.now();
            await writeInParallelBatches(items, writeConcurrency, async (batch) => {
                totalRetries += await sendBatchToDynamoDB(ddbClient, tableName, batch);
            });
            windowWriteMs += Date.now() - writeStartedAt;
            totalRows += items.length;
            windowRows += items.length;

            if (pageIndex % PROGRESS_LOG_EVERY_N_PAGES === 0) {
                const now = Date.now();
                logger.info(`[ECS Task] Progress (${taskLabel}): ${totalRows} rows saved (~${Math.round(totalRows / ((now - startedAt) / 1000))} rows/s overall, ~${Math.round(windowRows / ((now - windowStartedAt) / 1000))} rows/s on the last ${PROGRESS_LOG_EVERY_N_PAGES} pages).`, {
                    windowWaitPostgresMs: windowWaitFetchMs,
                    windowDynamoDbWriteMs: windowWriteMs,
                    totalRetries,
                });
                windowStartedAt = now;
                windowRows = 0;
                windowWaitFetchMs = 0;
                windowWriteMs = 0;
            }
        }

        await pgClient.query(`CLOSE ${cursorName};`);
        await pgClient.query('COMMIT');
        logger.info(`[ECS Task] DynamoDB backup (${taskLabel}) completed: ${totalRows} rows in ${pageIndex} page(s), ${totalRetries} retry(ies), ${Math.round((Date.now() - startedAt) / 1000)}s.`);
    } catch (error) {
        // A prefetch may still be in flight: settle it so it neither races the ROLLBACK nor rejects unhandled.
        await nextPage?.catch(() => undefined);
        await pgClient.query('ROLLBACK').catch(() => undefined);
        logger.error(`[ECS Task] CRITICAL ERROR during backup to DynamoDB (${taskLabel}, after ${totalRows} rows, page #${pageIndex}) : ${error}`);
        throw error;
    } finally {
        await pgClient.end();
    }
}

// Splits items into DynamoDB-sized batches and writes them with at most `concurrency` calls in flight.
async function writeInParallelBatches<T>(items: T[], concurrency: number, writeBatch: (batch: T[]) => Promise<void>): Promise<void> {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += DYNAMODB_BATCH_WRITE_LIMIT) {
        batches.push(items.slice(i, i + DYNAMODB_BATCH_WRITE_LIMIT));
    }
    let next = 0;
    const worker = async () => {
        while (next < batches.length) {
            await writeBatch(batches[next++]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, worker));
}
