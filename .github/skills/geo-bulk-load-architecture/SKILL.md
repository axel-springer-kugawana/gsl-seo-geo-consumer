---
name: geo-bulk-load-architecture
description: 'Explains the geo-bulk-load ECS batch pipeline (S3 Parquet -> DuckDB -> PostgreSQL -> DynamoDB) that rebuilds and backs up the SSOT geo dataset. Use when working on src/geo-bulk-load, infra/modules/geo-bulk-load, the DuckDB/Postgres bulk load, or the Postgres-to-DynamoDB backup jobs.'
---

# Geo Bulk Load Architecture

## Purpose
Batch ECS Fargate task that rebuilds the geo "source of truth" in PostgreSQL from Parquet exports on S3, then backs up the resulting data into DynamoDB for fast reads. It is the batch counterpart to the real-time [cm-connector/cm-consumer pipeline](../cm-connector-consumer-architecture/SKILL.md).

## Pipeline (chained in `src/geo-bulk-load/main.ts`)

1. **`processMassiveParquetToPostgres`** ([process-massive-parquet-to-postgres.ts](../../../src/geo-bulk-load/process-massive-parquet-to-postgres.ts))
   - Reads Parquet files from `s3://<GEO_MANAGEMENT_SYNC_BUCKET>/<GEO_MANAGEMENT_BUCKET_KEY>/{name,lineage,feature}/*.parquet` via DuckDB (`@duckdb/node-api`, in-memory instance, `aws`/`httpfs`/`postgres`/`json` extensions).
   - For each of `geoName`, `geoLineage`, `geoFeature`: creates an `UNLOGGED` staging table, bulk-copies rows filtered by `MANAGED_PREFIX_IDS`, inserts into the final table, re-adds the PK, drops the staging table.
   - Rebuilds `mv_geofeature_names` (materialized view joining geofeature+geoname) and the `v_geo_full` view (joins feature with country/region/province/municipality via the MV).
   - DuckDB talks to Postgres through its `postgres` extension (`ATTACH ... TYPE POSTGRES`); DDL (CREATE/TRUNCATE/constraints) goes through a native `pg` client instead, since DuckDB's postgres extension only supports `ALTER TABLE ADD COLUMN` and no `TRUNCATE`.
2. **`processMassiveSqlToDynamoDB`** — backs up `v_geo_full` into the `gsl-seo-geo-feature-*` DynamoDB table.
3. **`processGeoLineageFallbacksToDynamoDB`** — backs up `geolineage` (grouped by `oldid` into fallback lists) into the `gsl-seo-geo-lineage-*` DynamoDB table.

Steps 2 and 3 share `backupPostgresCursorToDynamoDB<T>()` in [process-massive-sql-to-dynamodb.ts](../../../src/geo-bulk-load/process-massive-sql-to-dynamodb.ts): declares a Postgres server-side cursor, `FETCH`es in pages (`GEO_DYNAMODB_FETCH_BATCH_SIZE`), maps rows via a `mapRow` callback, and writes to DynamoDB via `BatchWriteItemCommand` with bounded concurrency (`GEO_DYNAMODB_WRITE_CONCURRENCY`) and retry-with-backoff on throttling.

## Key files
- `src/geo-bulk-load/main.ts` — entrypoint, chains the 3 steps when run directly (`node dist/geo-bulk-load/main.js`)
- `src/geo-bulk-load/process-massive-parquet-to-postgres.ts` — Parquet -> Postgres
- `src/geo-bulk-load/process-massive-sql-to-dynamodb.ts` — Postgres -> DynamoDB (both tables)
- `src/geo-bulk-load/classified-api-secrets.ts` — fetches DB/API secrets from Secrets Manager (`GEO_DB_SECRET_ID`)
- `infra/modules/geo-bulk-load/*.tf` — ECS Fargate task def, ECR repo, IAM, security groups, EventBridge schedule
- `infra/modules/dynamodb` — generic single-table module (hash key `AvivGeoId`, sort key `version`) reused for both geo-feature and geo-lineage tables

## Environment variables (ECS task)
- `GEO_DB_SECRET_ID`, `GEO_MANAGEMENT_SYNC_BUCKET`, `GEO_MANAGEMENT_BUCKET_KEY`
- `DUCKDB_EXTENSION_DIRECTORY`, `DUCKDB_MEMORY_LIMIT`, `DUCKDB_TEMP_DIRECTORY`
- `GEO_DYNAMODB_TABLE_NAME`, `GEO_LINEAGE_DYNAMODB_TABLE_NAME`, `GEO_DYNAMODB_SCHEMA_VERSION`
- `GEO_DYNAMODB_FETCH_BATCH_SIZE`, `GEO_DYNAMODB_WRITE_CONCURRENCY`

## Deployment
Built as a Docker image (`DockerfileBatchCopyDatalake`) pushed to ECR by CircleCI, run as a scheduled or on-demand ECS Fargate task (see `.circleci/job-configs.yml`, `infra/modules/geo-bulk-load/main.tf`).

## Debugging notes
- Throttling/warmup errors on DynamoDB writes are retried automatically; sustained throttling usually means `GEO_DYNAMODB_WRITE_CONCURRENCY` is too high for a cold on-demand table.
- `ValidationException: The provided key element does not match the schema` means a write is missing the `version` sort key attribute (see DynamoDB schema notes in the [cm-connector-consumer-architecture skill](../cm-connector-consumer-architecture/SKILL.md)).
