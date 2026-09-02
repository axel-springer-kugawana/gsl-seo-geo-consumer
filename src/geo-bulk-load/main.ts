import { logger } from "@shared/cross-cutting/logger";
import { processMassiveParquetToPostgres } from './process-massive-parquet-to-postgres';
import { processMassiveSqlToDynamoDB, processGeoLineageFallbacksToDynamoDB } from './process-massive-sql-to-dynamodb';

export { processMassiveParquetToPostgres, processMassiveSqlToDynamoDB, processGeoLineageFallbacksToDynamoDB };

if (require.main === module) {
  // processMassiveParquetToPostgres()
  
  // .then
  processGeoLineageFallbacksToDynamoDB()
  .then(processMassiveSqlToDynamoDB)
  .catch((error) => {
    logger.error('[ECS Task] ERREUR CRITIQUE :', error);
    process.exitCode = 1;
  });


}