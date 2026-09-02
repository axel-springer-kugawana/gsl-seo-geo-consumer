import { Client as PgClient } from 'pg';
import { DynamoDBClient, BatchWriteItemCommand, WriteRequest } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { getClassifiedApiSecret } from "./classified-api-secrets";
import { logger } from "@shared/cross-cutting/logger";
import { Geo, GeoEntityBase, GeoName } from '../shared/models/geo/1.0.0/geo';
import { DeletedFallbackStructure } from '../models/geoManagementStructure';

// DynamoDB BatchWriteItem accepts a maximum of 25 items per request.
const DYNAMODB_BATCH_WRITE_LIMIT = 25;

type RawGeoName = { displayname?: string | null; name?: string | null; slug?: string | null; language?: string | null };

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
function mapRowToGeo(row: Record<string, any>): Partial<Geo> {
    return {
        AvivGeoId: row.avivgeoid,
        Code: row.mainpostalcode ?? undefined,
        CountryCode: row.countrycode ?? undefined,
        IsFictive: row.fictive ?? false,
        Level: row.level ?? undefined,
        PostalCodes: row.postalcodes ?? undefined,
        Names: mapRawNames(row.names),
        Country: mapGeoEntity(row.countryid, row.code, row.countryfictive, row.countrynames),
        Region: mapGeoEntity(row.regionid, row.regioncode, row.regionfictive, row.regionnames),
        Province: mapGeoEntity(row.provinceid, row.provincecode, row.provincefictive, row.provincenames),
        Municipality: mapGeoEntity(row.municipalityid, row.municipalitycode, row.municipalityfictive, row.municipalitynames),
    };
}

// geolineage -> DynamoDB fallback item consumed by the cm-consumer lambda (see markGeoAsDeleted
// in cm-consumer/adapters/geo-materialized-view-dynamodb.ts) : AvivGeoId + list of fallbacks.
function mapRowToGeoLineageFallback(row: Record<string, any>): { AvivGeoId: string; Fallbacks: DeletedFallbackStructure[] } {
    return {
        AvivGeoId: row.oldid,
        Fallbacks: row.fallbacks ?? [],
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

async function writeBatchToDynamoDB(
    ddbClient: DynamoDBClient,
    tableName: string,
    writeRequests: WriteRequest[]
): Promise<void> {
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
            logger.warn(`[ECS Task] DynamoDB unavailable (${(error as { name?: string })?.name}), likely warmup/throttling, retrying (${attempt}/5)...`);
            await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
            continue;
        }

        const unprocessed = response.UnprocessedItems?.[tableName];

        if (!unprocessed || unprocessed.length === 0) {
            if (attempt > 1) {
                logger.info(`[ECS Task] Batch successfully written to DynamoDB after ${attempt} attempt(s).`);
            }
            return;
        }

        attempt += 1;
        if (attempt > 5) {
            throw new Error(`[ECS Task] Definitive DynamoDB write failure after ${attempt} attempts (${unprocessed.length} items remaining).`);
        }
        logger.warn(`[ECS Task] ${unprocessed.length} items not processed by DynamoDB (likely throttling), retrying (${attempt}/5)...`);
        remaining = unprocessed;
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }
}


type BackupCursorToDynamoDbOptions<T> = {
    // Used in logs and to derive the SQL cursor name, to distinguish this backup from the others sharing this code path.
    taskLabel: string;
    dynamoTableNameEnvVar: string;
    declareCursorSql: (schema: string) => string;
    mapRow: (row: Record<string, any>) => T;
};

// Shared server-side-cursor -> DynamoDB batch backup: fetches rows in pages, converts them via
// mapRow, and writes them to DynamoDB with bounded concurrency and retry-on-throttling.
async function backupPostgresCursorToDynamoDB<T extends Record<string, any>>(
    options: BackupCursorToDynamoDbOptions<T>
): Promise<void> {
    const { taskLabel, dynamoTableNameEnvVar, declareCursorSql, mapRow } = options;
    const cursorName = `${taskLabel}_cursor`;

    logger.info(`[ECS Task] Starting bulk backup of ${taskLabel} to DynamoDB...`);

    const apisecrets = await getClassifiedApiSecret(process.env.GEO_DB_SECRET_ID || '');

    const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';
    const PG_HOST = apisecrets.DbHostWriter;
    const PG_PORT = apisecrets.DbPort;
    const PG_DATABASE = apisecrets.DbMainDatabase;
    const PG_USER = apisecrets.DbUsername;
    const PG_PASSWORD = apisecrets.DbPassword;
    const PG_SCHEMA = 'public';
    const DYNAMODB_TABLE_NAME = process.env[dynamoTableNameEnvVar];
    const FETCH_BATCH_SIZE = Number(process.env.GEO_DYNAMODB_FETCH_BATCH_SIZE || '1000');
    const WRITE_CONCURRENCY = Number(process.env.GEO_DYNAMODB_WRITE_CONCURRENCY || '20');

    if (!PG_HOST || !PG_DATABASE || !PG_USER || !PG_PASSWORD || !DYNAMODB_TABLE_NAME) {
        throw new Error('[ECS Task] ERROR: Missing PostgreSQL or DynamoDB variables.');
    }

    logger.info(`[ECS Task] DynamoDB backup configuration (${taskLabel})`, {
        AWS_REGION,
        DYNAMODB_TABLE_NAME,
        FETCH_BATCH_SIZE,
        WRITE_CONCURRENCY,
        DYNAMODB_BATCH_WRITE_LIMIT,
    });

    const pgClient = new PgClient({
        host: PG_HOST,
        port: Number(PG_PORT),
        database: PG_DATABASE,
        user: PG_USER,
        password: PG_PASSWORD,
    });
    await pgClient.connect();
    logger.info('[ECS Task] PostgreSQL connection established.');

    const ddbClient = new DynamoDBClient({ region: AWS_REGION });

    let totalRowsProcessed = 0;
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
            logger.info(`[ECS Task] Batch #${batchIndex}: ${result.rows.length} rows fetched from PostgreSQL in ${Date.now() - fetchStartedAt}ms.`);

            const writeRequests: WriteRequest[] = result.rows.map((row) => ({
                PutRequest: { Item: marshall(mapRow(row), { removeUndefinedValues: true }) },
            }));

            const chunks = chunkArray(writeRequests, DYNAMODB_BATCH_WRITE_LIMIT);
            logger.info(`[ECS Task] Batch #${batchIndex}: writing ${chunks.length} DynamoDB chunk(s) with a concurrency of ${WRITE_CONCURRENCY}...`);

            const writeStartedAt = Date.now();
            const writeTasks = chunks.map((chunk) => () => writeBatchToDynamoDB(ddbClient, DYNAMODB_TABLE_NAME, chunk));
            await runWithConcurrency(writeTasks, WRITE_CONCURRENCY);

            totalRowsProcessed += result.rows.length;
            const elapsedSeconds = (Date.now() - startedAt) / 1000;
            const throughput = Math.round(totalRowsProcessed / elapsedSeconds);
            logger.info(`[ECS Task] Batch #${batchIndex}: written in ${Date.now() - writeStartedAt}ms. Total: ${totalRowsProcessed} rows saved (~${throughput} rows/s).`);
        }

        await pgClient.query(`CLOSE ${cursorName};`);
        await pgClient.query('COMMIT');
        logger.info(`[ECS Task] DynamoDB backup (${taskLabel}) completed successfully: ${totalRowsProcessed} rows processed in ${batchIndex} batch(es), total duration ${Math.round((Date.now() - startedAt) / 1000)}s.`);
    } catch (error) {
        await pgClient.query('ROLLBACK').catch(() => undefined);
        logger.error(`[ECS Task] CRITICAL ERROR during backup to DynamoDB (${taskLabel}, after ${totalRowsProcessed} rows processed, batch #${batchIndex}) : ${error}`);
        throw error;
    } finally {
        await pgClient.end();
        logger.info('[ECS Task] PostgreSQL connection closed.');
    }
}

export async function processMassiveSqlToDynamoDB(): Promise<void> {
    return backupPostgresCursorToDynamoDB({
        taskLabel: 'geo_full',
        dynamoTableNameEnvVar: 'GEO_DYNAMODB_TABLE_NAME',
        mapRow: mapRowToGeo,
        declareCursorSql: (schema) => `
      SELECT
            avivgeoid, mainpostalcode, countrycode, fictive, level, postalcodes, names,
            countryid, code, countryfictive, countrynames,
            regionid, regioncode, regionfictive, regionnames,
            provinceid, provincecode, provincefictive, provincenames,
            municipalityid, municipalitycode, municipalityfictive, municipalitynames
      FROM ${schema}.v_geo_full;
    `,
    });
}

export async function processGeoLineageFallbacksToDynamoDB(): Promise<void> {
    return backupPostgresCursorToDynamoDB({
        taskLabel: 'geo_lineage',
        dynamoTableNameEnvVar: 'GEO_LINEAGE_DYNAMODB_TABLE_NAME',
        mapRow: mapRowToGeoLineageFallback,
        declareCursorSql: (schema) => `
      SELECT oldid,
             json_agg(jsonb_build_object('ancestor_id', g.oldid, 'descendant_id', g.newid)) AS fallbacks
      FROM ${schema}.geolineage g
      GROUP BY oldid;
    `,
    });
}

