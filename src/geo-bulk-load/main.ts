import { logger } from "@shared/cross-cutting/logger";
import { processMassiveParquetToPostgres as parquetToPG } from './process-massive-parquet-to-postgres';
import { processMassiveSqlToDynamoDB as pgGeoFullToDynamoDB, processGeoLineageFallbacksToDynamoDB as pgGeoLineageToDynamoDB } from './process-massive-sql-to-dynamodb';
import {  importLegacyMappingFallbacksToDynamoDB } from './process-massive-s3-to-dynamodb';

export { parquetToPG as processMassiveParquetToPostgres, pgGeoFullToDynamoDB as processMassiveSqlToDynamoDB, importLegacyMappingFallbacksToDynamoDB };

const GEO_LEGACY_MAPPING_LOAD_TASK = 'geo-legacy-mapping-load';

async function runGeoBulkLoadTask(): Promise<void> {
  const taskName = process.env.GEO_BULK_LOAD_TASK;
  logger.info(`Running task: ${taskName}`);

  if (taskName === GEO_LEGACY_MAPPING_LOAD_TASK) {
    await importLegacyMappingFallbacksToDynamoDB();
    return;
  }

  await parquetToPG();
  await pgGeoLineageToDynamoDB();
  await pgGeoFullToDynamoDB();
}

if (require.main === module) {
  runGeoBulkLoadTask()
    .catch((error) => {
      logger.error('[ECS Task] ERREUR CRITIQUE :', error);
      process.exitCode = 1;
    });
}