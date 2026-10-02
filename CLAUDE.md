# CLAUDE.md

This file guides Claude Code (claude.ai/code) when it works in this repository.

## What this repo is

This repo syncs AVIV Geo Management ("geo" SSOT) data into the SEO account's own stores: DynamoDB tables and an Aurora PostgreSQL materialized view. It has two pipelines that write the same tables:

- **Real-time (Lambdas)**: `cm-connector` → `cm-consumer`. SNS FIFO → SQS FIFO → Lambdas. Each geo created/updated/deleted event is applied incrementally.
- **Batch (ECS Fargate)**: `geo-bulk-load`. A full replay from a Parquet snapshot on S3, run through DuckDB → PostgreSQL → DynamoDB. The same image also runs the legacy URL mapping import (S3 CSV → DynamoDB).

Read these before making non-trivial changes. They are detailed and kept up to date:
- [.github/skills/cm-connector-consumer-architecture/SKILL.md](.github/skills/cm-connector-consumer-architecture/SKILL.md): the event pipeline, the DynamoDB key schema, and the `lastupdatedate` optimistic concurrency.
- [.github/skills/geo-bulk-load-architecture/SKILL.md](.github/skills/geo-bulk-load-architecture/SKILL.md): the bulk-load steps, the DuckDB/pg split, and cursor-based backups to DynamoDB.
- [README.md](README.md): running the ECS task, local Docker runs, and **lock-file rules for CI**.
- [docs/releases/](docs/releases/): release notes, one per Jira ticket (`GDA-xxx.md`).

## Commands

All application code lives in `src/`, which has its own `package.json` and `package-lock.json`. Run npm commands from `src/`.

```bash
cd src
npm test                                        # jest (ts-jest), all *.test.ts
npx jest cm-consumer/lambda-handlers/process-cm-connector-geo-events-fifo.test.ts   # single file
npx jest -t "name of test"                      # single test by name
npm run watch                                   # tsc --noEmit type-check in watch mode
npx tsc --noEmit -p tsconfig.json               # one-off type-check
npm run build:lambdas                           # esbuild: every **/lambda-handlers/*.ts -> dist/
npm run build:tasks                             # esbuild: geo-bulk-load/main.ts -> dist/ (duckdb kept external)
npm run smoke:geo-bulk-load                     # build tasks + check the bundle exports load
npm run local                                   # express server that invokes lambdas locally (POST /:lambda/:handler/)
npm run local:geo-bulk-load                     # run the ECS task entrypoint with tsx
npm run generate:models                         # regenerate shared/models/geo-api.ts from Place API OpenAPI
```

Local runs use AWS SSO profile `AvivPowerUserAccessReadWrite-135557783010` (the dev account). From the repo root, log in with `pnpm aws:login`. "Local" is detected by `AWS_EXECUTION_ENV` being unset, and `createDynamoDBClient` then switches to SSO credentials.

Docker image for the ECS task (build context is the repo root, amd64 only):
```bash
docker build -f DockerfileBatchCopyDatalake -t geo-bulk-load .
```

## Layout

```
src/
  cm-connector/   SQS-triggered Lambda: parses GeoManagementEvent, republishes CloudEvents-style envelope
  cm-consumer/    SQS-triggered Lambda: created/updated -> enrich via Place API + upsert DynamoDB/Postgres;
                  deleted -> write lineage fallbacks + soft-delete (softdeleted + expireat TTL)
  geo-bulk-load/  ECS task entrypoint (main.ts) and the batch jobs
  shared/         adapters (dynamodb-client, dynamodb-retry, pg-client), logger, env helpers, models
  models/         GeoManagementStructure / geo event types (imported as @models)
  local/          local lambda invoke harness (.local.env)
infra/            Terraform root (tfvars per env: dev / preview / live; backend.<env>.tfvars)
  modules/        cm-connector, cm-consumer, geo-bulk-load, dynamodb, s3, constructs/*
```

Path aliases (in `src/tsconfig.json`, mirrored in jest via `pathsToModuleNameMapper`): `@shared/*`, `@cm-connector/*`, `@geo-bulk-load/*`, `@models`. Some files also use bare `cm-consumer/...` imports, which resolve through `baseUrl`.

## Things that are easy to get wrong

- **Adding a Lambda**: the build globs `**/lambda-handlers/*.ts`, excluding `*.test.ts`. Any non-test file placed in a `lambda-handlers/` dir becomes a bundle. Terraform points at `../src/dist/<path>.js` (see `infra/main.tf`).
- **ECS task selection**: `geo-bulk-load/main.ts` branches on `GEO_BULK_LOAD_TASK`:
  - unset: runs the full replay, `parquetToPG` → lineage → feature backup to DynamoDB.
  - `geo-legacy-mapping-load`: runs `importLegacyMappingFallbacksToDynamoDB` only.

  Both are separate ECS task definitions in `infra/modules/geo-bulk-load/main.tf` that share one image. The EventBridge schedule (optional, `schedule.tf`) only targets the full replay.
- **Legacy mapping import** (`process-massive-s3-to-dynamodb.ts`): reads `;`-delimited CSVs with columns `url_legacy;geo_level;url_new;match_type` from the `<aws_account_name>-seo-geo-legacy-mapping` bucket. The file → brand list is hard-coded in `LEGACY_MAPPING_SOURCES`. It writes to `gsl-seo-geo-legacy-mapping-<env>` (PK `LegacyGeoId`, SK `Brand`). Rows with an empty `url_legacy` are skipped.
- **DynamoDB keys**: the geo-feature and geo-lineage tables use PK `AvivGeoId` and SK `version`. `version` is a *static schema version* (`GEO_DYNAMODB_SCHEMA_VERSION`, default `"3.1"`), not a timestamp. Stale-write protection is done by the `lastupdatedate` condition. A `ConditionalCheckFailedException` there is expected and intentionally swallowed.
- **Batch writes**: use `sendBatchToDynamoDB` / `DYNAMODB_BATCH_WRITE_LIMIT` (25) from `@shared/adapters/dynamodb-client`. It retries unprocessed items and throttling.
- **DuckDB vs pg**: DuckDB's postgres extension can't do TRUNCATE or most DDL, so DDL goes through the native `pg` client. DuckDB native bindings are platform-specific. They stay external to the esbuild bundle, and the image must be `linux/amd64`. The `httpfs`, `aws` and `postgres` extensions are baked into the image at build time.
- **Env vars**: read with `requireEnvironmentVariable()` from `@shared/cross-cutting/environment`, which throws if a var is missing. Adding a var means adding it to the Terraform module too: `container_environment` in `geo-bulk-load/main.tf`, or the Lambda env in `cm-consumer/process-cm-events-lambda.tf`. It usually also needs an IAM statement in the same module (`iam.tf` for ECS).
- **Dependencies / lock file**: after any change to `src/package.json`, regenerate `src/package-lock.json` in the same commit with `npx npm@10 install --package-lock-only`. The image uses npm 10, and `npm ci` fails on a mismatched lock file. Never hand-edit the lock file. See the README "Changing dependencies" section. (The root `pnpm-lock.yaml` is used only by the CircleCI build/test job.)
- Some code comments and log messages are in French. Keep new comments consistent with the surrounding file.

## CI/CD

CircleCI (`.circleci/job-configs.yml`) runs the same pipeline for every environment:
1. Build job: `pnpm -C src/ run test` and `build:lambdas`.
2. `Docker build and push` to ECR as `gm-consumer-<env>-geo-bulk-load`.
3. `terraform apply` in `infra/` (Terraform 1.5.7), with `TF_VAR_geo_bulk_load_image_tag=sha1-<commit>`.

Where each environment deploys from:
- **dev**: any non-`main` branch.
- **preview**: `main`.
- **live**: a `vX.Y.Z` tag, after a manual approval.

AWS accounts: dev `135557783010`, preview `638670099833`, live `944405982502`.
