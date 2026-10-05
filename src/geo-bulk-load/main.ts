import { logger } from "@shared/cross-cutting/logger";
import { parquetToPG } from './process-massive-parquet-to-postgres';
import { processGeoFeatureToDynamoDB, pgGeoLineageToDynamoDB, pgGeoLinkToDynamoDB } from './process-massive-sql-to-dynamodb';
import {  importLegacyMappingFallbacksToDynamoDB } from './process-massive-s3-to-dynamodb';

export {  processGeoFeatureToDynamoDB, pgGeoLineageToDynamoDB , pgGeoLinkToDynamoDB, importLegacyMappingFallbacksToDynamoDB };

const GEO_LEGACY_MAPPING_LOAD_TASK = 'geo-legacy-mapping-load';

async function runGeoBulkLoadTask(): Promise<void> {
  const taskName = process.env.GEO_BULK_LOAD_TASK;
  logger.info(`Running task: ${taskName}`);

  if (taskName === GEO_LEGACY_MAPPING_LOAD_TASK) {
    await importLegacyMappingFallbacksToDynamoDB();
    return;
  }

  await parquetToPG();
  await pgGeoLineageToDynamoDB()
    .then(pgGeoLinkToDynamoDB)
    .then(processGeoFeatureToDynamoDB);
  // await processGeoFeatureToDynamoDB();
}

if (require.main === module) {
  runGeoBulkLoadTask()
    .catch((error) => {
      logger.error('[ECS Task] ERREUR CRITIQUE :', error);
      process.exitCode = 1;
    });
}