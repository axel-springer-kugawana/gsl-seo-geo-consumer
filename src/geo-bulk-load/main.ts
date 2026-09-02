import { logger } from "@shared/cross-cutting/logger";
import { processMassiveParquetToPostgres } from './process-massive-parquet-to-postgres';
import { processMassiveSqlToDynamoDB } from './process-massive-sql-to-dynamodb';

export { processMassiveParquetToPostgres, processMassiveSqlToDynamoDB };

if (require.main === module) {
  // processMassiveParquetToPostgres().catch((error) => {
  //   logger.error('[ECS Task] ERREUR CRITIQUE :', error);
  //   process.exitCode = 1;
  // });

  processMassiveSqlToDynamoDB().catch((error) => {
    logger.error('[ECS Task] ERREUR CRITIQUE :', error);
    process.exitCode = 1;
  });
}