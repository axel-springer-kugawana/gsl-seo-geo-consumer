import { logger } from "@shared/cross-cutting/logger";
import { SQSBatchItemFailure, SQSRecord } from "aws-lambda";

export const processSQSRecords = async (records: SQSRecord[], recordProcessor: (record: SQSRecord) => Promise<void>): Promise<SQSBatchItemFailure[]> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for(let i = 0; i < records.length; i++) {
    try {
      await recordProcessor(records[i]);
    } catch (error) {
      logger.error(`Error processing record`, {
        error
      })

      batchItemFailures.push({
        itemIdentifier: records[i].messageId
      })
    }
  }

 

  return batchItemFailures;

}



export const chunkProcessSQSRecords = async (records: SQSRecord[], chunkSize: number, chunkProcessor: (chunk: SQSRecord[]) => Promise<void>): Promise<SQSBatchItemFailure[]> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);

    try {
      await chunkProcessor(chunk);
    } catch (error) {

      const failedItemIds = chunk.map(record => ({ itemIdentifier: record.messageId }))
      batchItemFailures.push(...failedItemIds);
    }

  }


  return batchItemFailures;

}