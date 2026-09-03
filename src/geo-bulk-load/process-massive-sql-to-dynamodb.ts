import { DynamoDBClient, BatchWriteItemCommand, WriteRequest } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { createDynamoDBClient } from "@shared/adapters/dynamodb-client";
import { getClassifiedApiSecret } from "./classified-api-secrets";
import { createPgClient } from "@shared/adapters/pg-client";
import { GEO_DYNAMODB_SCHEMA_VERSION } from "@shared/models/geo-dynamodb-schema-version";
import { logger } from "@shared/cross-cutting/logger";
import { Geo, GeoEntityBase, GeoName } from '../shared/models/geo/1.0.0/geo';
import { GeoLineageFallbackItem } from '../models/geoManagementStructure';

// DynamoDB BatchWriteItem accepts a maximum of 25 items per request.
const DYNAMODB_BATCH_WRITE_LIMIT = 25;
const PG_SCHEMA = 'public';
const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';

type RawGeoName = { displayname?: string | null; name?: string | null; slug?: string | null; language?: string | null };

export async function processMassiveSqlToDynamoDB(): Promise<void> {
    return backupPostgresCursorToDynamoDB({
        key: 'v_geo_feature',
        dynamoTableNameEnvVar: 'GEO_DYNAMODB_TABLE_NAME',
        mapRow: mapRowGeoFull,
        declareCursorSql: (schema) => `
      SELECT
            avivgeoid, mainpostalcode, countrycode, fictive, level, postalcodes, names,
            countryid, code, countryfictive, countrynames,
            regionid, regioncode, regionfictive, regionnames,
            provinceid, provincecode, provincefictive, provincenames,
            municipalityid, municipalitycode, municipalityfictive, municipalitynames,
            streetcode, streetfictive, streetlevel, streetnames, streetids
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

function firstString(items: string[] | null | undefined): string | null {
    return items?.[0] ?? null;
}

// v_geo_full -> shared Geo model (shared/models/geo/1.0.0/geo.ts). Geo fields left unmapped
// due to no equivalent in the view: Version, Macroregion, AvailableNeighborhoods,
// ImmoweltLegacyMappings, LogicImmoLegacyMapping, NeighbouringGeoLevels, SelogerLegacyMapping,
// SurroundingMunicipalitiesIds, ttl, UpdateDate.
function mapRowGeoFull(row: Record<string, any>): Partial<Geo> {
    return {
        AvivGeoId: row.avivgeoid,
        Code: row.mainpostalcode ?? undefined,
        CountryCode: row.countrycode ?? undefined,
        IsFictive: row.fictive ?? false,
        Level: row.level ?? undefined,
        PostalCodes: row.postalcodes ?? undefined,
        Parents : row.parents??undefined,
        Type : row.type ?? undefined,
        Names: mapRawNames(row.names),
        Country: mapGeoEntity(row.countryid, row.code, row.countryfictive, row.countrynames),
        Region: mapGeoEntity(row.regionid, row.regioncode, row.regionfictive, row.regionnames),
        Province: mapGeoEntity(row.provinceid, row.provincecode, row.provincefictive, row.provincenames),
        Municipality: mapGeoEntity(row.municipalityid, row.municipalitycode, row.municipalityfictive, row.municipalitynames),
        Street: mapGeoEntity(firstString(row.streetids), row.streetcode, row.streetfictive, row.streetnames),
        StreetIds: row.streetids ?? undefined,
        AvailableNeighborhoods: row.neighbouringgeos
    };
}

// geolineage -> DynamoDB fallback item consumed by the cm-consumer lambda (see markGeoAsDeleted
// in cm-consumer/adapters/geo-materialized-view-dynamodb.ts) : AvivGeoId + list of fallbacks.
function mapRowGeoLineage(row: Record<string, any>): GeoLineageFallbackItem {
    return {
        AvivGeoId: row.oldid,
        Fallbacks: row.fallbacks ?? []
    };
}

function chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

// Runs the tasks with a limited number of concurrent in-flight DynamoDB calls.
async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<void> {
    let cursor = 0;

    async function worker(): Promise<void> {
        while (cursor < tasks.length) {
            const taskIndex = cursor;
            cursor += 1;
            await tasks[taskIndex]();
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
}

// Transient DynamoDB errors (throttling, cold warmup of an on-demand table, request limits)
// for which we should retry instead of aborting the whole backup.
const RETRYABLE_DYNAMODB_ERROR_NAMES = new Set([
    'ProvisionedThroughputExceededException',
    'ThrottlingException',
    'RequestLimitExceeded',
    'InternalServerError',
    'LimitExceededException',
]);

function isRetryableDynamoDbError(error: unknown): boolean {
    const errorName = (error as { name?: string })?.name;
    return typeof errorName === 'string' && RETRYABLE_DYNAMODB_ERROR_NAMES.has(errorName);
}

// Writes PutRequests to DynamoDB: an upsert per item (creates it if absent, fully replaces it if present).
// Returns the number of retries it took, so the caller can aggregate a single error summary instead of logging each retry.
async function writeBatchToDynamoDB(
    ddbClient: DynamoDBClient,
    tableName: string,
    writeRequests: WriteRequest[]
): Promise<number> {
    let remaining = writeRequests;
    let attempt = 0;

    while (remaining.length > 0) {
        let response;
        try {
            response = await ddbClient.send(
                new BatchWriteItemCommand({ RequestItems: { [tableName]: remaining } })
            );
        } catch (error) {
            attempt += 1;
            if (!isRetryableDynamoDbError(error) || attempt > 5) {
                logger.error(`[ECS Task] Non-recoverable DynamoDB failure after ${attempt} attempt(s) (${(error as { name?: string })?.name ?? 'unknown'}) : ${error}`);
                throw error;
            }
            logger.debug(`[ECS Task] DynamoDB unavailable (${(error as { name?: string })?.name}), likely warmup/throttling, retrying (${attempt}/5)...`);
            await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
            continue;
        }

        const unprocessed = response.UnprocessedItems?.[tableName];

        if (!unprocessed || unprocessed.length === 0) {
            return attempt;
        }

        attempt += 1;
        if (attempt > 5) {
            throw new Error(`[ECS Task] Definitive DynamoDB write failure after ${attempt} attempts (${unprocessed.length} items remaining).`);
        }
        logger.debug(`[ECS Task] ${unprocessed.length} items not processed by DynamoDB (likely throttling), retrying (${attempt}/5)...`);
        remaining = unprocessed;
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }

    return attempt;
}


type BackupCursorToDynamoDbOptions<T> = {
    // Used in logs and to derive the SQL cursor name, to distinguish this backup from the others sharing this code path.
    key: string;
    dynamoTableNameEnvVar: string;
    declareCursorSql: (schema: string) => string;
    mapRow: (row: Record<string, any>) => T;
};

// Shared server-side-cursor -> DynamoDB batch backup: fetches rows in pages, converts them via
// mapRow, and writes them to DynamoDB with bounded concurrency and retry-on-throttling.
async function backupPostgresCursorToDynamoDB<T extends Record<string, any>>(
    options: BackupCursorToDynamoDbOptions<T>
): Promise<void> {
    const { key: taskLabel, dynamoTableNameEnvVar, declareCursorSql, mapRow } = options;
    const cursorName = `${taskLabel}_cursor`;

    logger.info(`[ECS Task] Starting bulk backup of ${taskLabel} to DynamoDB...`);

    const apisecrets = await getClassifiedApiSecret(process.env.GEO_DB_SECRET_ID || '');

   
    const DYNAMODB_TABLE_NAME = process.env[dynamoTableNameEnvVar];
    const FETCH_BATCH_SIZE = Number(process.env.GEO_DYNAMODB_FETCH_BATCH_SIZE || '1000');
    const WRITE_CONCURRENCY = Number(process.env.GEO_DYNAMODB_WRITE_CONCURRENCY || '20');

    if (!DYNAMODB_TABLE_NAME) {
        throw new Error(`[ECS Task] ERROR: ${dynamoTableNameEnvVar} environment variable is not set.`);
    }

    logger.info(`[ECS Task] DynamoDB backup configuration (${taskLabel})`, {
        AWS_REGION,
        DYNAMODB_TABLE_NAME,
        FETCH_BATCH_SIZE,
        WRITE_CONCURRENCY,
        DYNAMODB_BATCH_WRITE_LIMIT,
    });

    const pgClient = await createPgClient(apisecrets);
    await pgClient.connect();
    logger.info('[ECS Task] PostgreSQL connection established.');

    const ddbClient = createDynamoDBClient(AWS_REGION);

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

            const writeRequests: WriteRequest[] = result.rows.map((row) => {
                const {  ...item } = mapRow(row) as { Version?: string } & Record<string, any>;
                // 'version' is the table's static sort key ("V1" | "V2"); drop the capitalized
                // "Version" data field so it isn't stored redundantly alongside the sort key.
                return {
                    PutRequest: { Item: marshall({ ...item, version: GEO_DYNAMODB_SCHEMA_VERSION }, { removeUndefinedValues: true }) },
                };
            });

            const chunks = chunkArray(writeRequests, DYNAMODB_BATCH_WRITE_LIMIT);
            logger.debug(`[ECS Task] Batch #${batchIndex}: writing ${chunks.length} DynamoDB chunk(s) with a concurrency of ${WRITE_CONCURRENCY}...`);

            const writeStartedAt = Date.now();
            const writeTasks = chunks.map((chunk) => async () => {
                const retries = await writeBatchToDynamoDB(ddbClient, DYNAMODB_TABLE_NAME, chunk);
                if (retries > 0) {
                    totalRetriedBatches += 1;
                    logger.warn(`[ECS Task] Batch #${batchIndex}: a chunk needed ${retries} retry(ies) (throttling/warmup).`);
                }
            });
            await runWithConcurrency(writeTasks, WRITE_CONCURRENCY);

            totalRowsProcessed += result.rows.length;
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


