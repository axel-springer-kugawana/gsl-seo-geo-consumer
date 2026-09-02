import { logger } from "@shared/cross-cutting/logger";
import { processMassiveParquetToPostgres } from './process-massive-parquet-to-postgres';
import { processMassiveSqlToDynamoDB as processGeoFullToDynamoDB, processGeoLineageFallbacksToDynamoDB as processGeoLineageToDynamoDB } from './process-massive-sql-to-dynamodb';

export { processMassiveParquetToPostgres, processGeoFullToDynamoDB as processMassiveSqlToDynamoDB, processGeoLineageToDynamoDB as processGeoLineageFallbacksToDynamoDB };

if (require.main === module) {
  // processMassiveParquetToPostgres().catch((error) => {
  //   logger.error('[ECS Task] ERREUR CRITIQUE :', error);
  //   process.exitCode = 1;
  // });


   processGeoLineageToDynamoDB()
    .catch((error) => {
      logger.error('[ECS Task] ERREUR CRITIQUE :', error);
      process.exitCode = 1;
    });

  // processGeoFullToDynamoDB()
  //   .catch((error) => {
  //     logger.error('[ECS Task] ERREUR CRITIQUE :', error);
  //     process.exitCode = 1;
  //   });
}