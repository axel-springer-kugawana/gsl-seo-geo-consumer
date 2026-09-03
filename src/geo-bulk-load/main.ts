import { logger } from "@shared/cross-cutting/logger";
import { processMassiveParquetToPostgres as parquetToPG } from './process-massive-parquet-to-postgres';
import { processMassiveSqlToDynamoDB as pgGeoFullToDynamoDB, processGeoLineageFallbacksToDynamoDB as pgGeoLineageToDynamoDB } from './process-massive-sql-to-dynamodb';

export { parquetToPG as processMassiveParquetToPostgres, pgGeoFullToDynamoDB as processMassiveSqlToDynamoDB, pgGeoLineageToDynamoDB as processGeoLineageFallbacksToDynamoDB };

if (require.main === module) {
  pgGeoLineageToDynamoDB()
 // parquetToPG()
   // .then(pgGeoLineageToDynamoDB)
   // .then(pgGeoFullToDynamoDB)
    .catch((error) => {
      logger.error('[ECS Task] ERREUR CRITIQUE :', error);
      process.exitCode = 1;
    });
}