import { logger } from "@shared/cross-cutting/logger";
import { processMassiveParquetToPostgres } from './process-massive-parquet-to-postgres';
import { processMassiveSqlToDynamoDB, processGeoLineageFallbacksToDynamoDB } from './process-massive-sql-to-dynamodb';

export { processMassiveParquetToPostgres, processMassiveSqlToDynamoDB, processGeoLineageFallbacksToDynamoDB };

if (require.main === module) {
  processMassiveParquetToPostgres().catch((error) => {
    logger.error('[ECS Task] ERREUR CRITIQUE :', error);
    process.exitCode = 1;
  });


  processGeoLineageFallbacksToDynamoDB()
    .catch((error) => {
      logger.error('[ECS Task] ERREUR CRITIQUE :', error);
      process.exitCode = 1;
    });

  processMassiveSqlToDynamoDB()
    .catch((error) => {
      logger.error('[ECS Task] ERREUR CRITIQUE :', error);
      process.exitCode = 1;
    });
}