---
name: cm-connector-consumer-architecture
description: 'Explains the event-driven pipeline that syncs geo management ("classified") events from the external SSOT into DynamoDB: cm-connector (SNS/SQS ingestion + FIFO republishing) and cm-consumer (materialized-view writer). Use when working on src/cm-connector, src/cm-consumer, their infra modules, or debugging geo event processing / DynamoDB writes.'
---

# cm-connector / cm-consumer Architecture

## Purpose
Real-time counterpart to [geo-bulk-load](../geo-bulk-load-architecture/SKILL.md): consumes individual geo "created/updated/deleted" events from the external SSOT (geo management system) and keeps the two DynamoDB tables (`gsl-seo-geo-updated-*`, `gsl-seo-geo-lineage-*`) up to date incrementally.

## Pipeline

1. **cm-connector** (`src/cm-connector`)
   - `geo_management_events_fifo_topic` (external SNS FIFO topic) -> the `cm-events-handling` infra module subscribes an internal FIFO SQS queue (`connector_internal_queue_fifo`).
   - [handle-geo-events-fifo.ts](../../../src/cm-connector/lambda-handlers/handle-geo-events-fifo.ts) (SQS-triggered lambda, `BatchProcessor`) parses each `GeoManagementEvent` and republishes a normalized CloudEvents-style envelope via `publishFullClassifiedEvent()` ([adapters/geo-event-publisher-fifo.ts](../../../src/cm-connector/adapters/geo-event-publisher-fifo.ts)) onto `connectorEventsQueue` — the same `connector_internal_queue_fifo`, read by cm-consumer.
   - Envelope shape: `{ id, idempotencykey, specversion, source, type: "<SSotEntityName>.<created|updated|deleted>.v1", data }`.
2. **cm-consumer** (`src/cm-consumer`)
   - [process-cm-connector-geo-events-fifo.ts](../../../src/cm-consumer/lambda-handlers/process-cm-connector-geo-events-fifo.ts) (SQS-triggered lambda, `BatchProcessor`) reads the same FIFO queue and switches on `type`:
     - `*.deleted.v1` -> `markGeoAsDeleted()`
     - `*.created.v1` / `*.updated.v1` -> `createOrUpdateGeo()`
   - Both live in [adapters/geo-materialized-view-dynamodb.ts](../../../src/cm-consumer/adapters/geo-materialized-view-dynamodb.ts):
     - `createOrUpdateGeo`: enriches the geo via the Geo Place API (`getGeoApiClient`), maps parents (Country/Region/Province/Municipality) via `mapParentToGeoEntity`, then `updateDataInDynamoDB()` writes/updates the item in `MV_UPDATED_TABLE_NAME` at key `{ AvivGeoId, version: <schema version> }`, guarded by a `lastupdatedate` optimistic-concurrency condition.
     - `markGeoAsDeleted`: writes the fallback list to `MV_DELETED_TABLE_NAME` (same `updateDataInDynamoDB`), then soft-deletes the item in `MV_UPDATED_TABLE_NAME` (sets `softdeleted` + `expireat` TTL) via a direct `UpdateItemCommand`.

## Key files
- `src/cm-connector/lambda-handlers/handle-geo-events-fifo.ts` — SNS/SQS ingestion + republish
- `src/cm-connector/adapters/geo-event-publisher-fifo.ts` — builds/sends the CloudEvents-style envelope
- `src/cm-connector/config/configuration-provider.ts` — runtime config (queue URLs, etc.)
- `src/cm-consumer/lambda-handlers/process-cm-connector-geo-events-fifo.ts` — routes by event type
- `src/cm-consumer/adapters/geo-materialized-view-dynamodb.ts` — DynamoDB read/write logic, optimistic concurrency, soft-delete
- `src/cm-consumer/adapters/geoMapper.ts` — `GeoManagementStructure` -> shared `Geo` model mapping
- `infra/modules/cm-connector/**`, `infra/modules/cm-consumer/**` — lambdas, SQS/SNS subscriptions, IAM

## DynamoDB schema (both tables, module `infra/modules/dynamodb`)
- Hash key: `AvivGeoId`
- Sort key: `version` — a static schema version (e.g. `"V1"`/`"V2"`), sourced from the `GEO_DYNAMODB_SCHEMA_VERSION` env var, NOT a changing timestamp.
- Concurrency: a separate `lastupdatedate` attribute (distinct from the `version` sort key) guards against out-of-order writes via a DynamoDB `ConditionExpression`.

## Environment variables (lambdas)
- `MV_UPDATED_TABLE_NAME`, `MV_DELETED_TABLE_NAME`, `MV_APPLICATION_NAME`, `GEO_DYNAMODB_SCHEMA_VERSION`

## Debugging notes
- `ValidationException: The provided key element does not match the schema` on a DynamoDB write means the `Key` is missing the `version` sort key attribute, or `GEO_DYNAMODB_SCHEMA_VERSION` doesn't match what was used when the item was created.
- Local dev routes DynamoDB writes to a fixed local table name (`seo-ssot-classified-fifo`) and uses SSO credentials (`isLocal` check in `geo-materialized-view-dynamodb.ts`).
