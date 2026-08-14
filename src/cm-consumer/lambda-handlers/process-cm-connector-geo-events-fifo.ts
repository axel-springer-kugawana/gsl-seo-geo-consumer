import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { createOrUpdateGeo , markGeoAsDeleted } from "cm-consumer/adapters/geo-materialized-view-dynamodb";
import { logger } from "@shared/cross-cutting/logger";
//import * as fs from 'fs';

import { GeoManagementStructure } from "@models";


const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord, context: Context): Promise<void> => {

  logger.warn('Processing record', { recordId: record.messageId
    ,eventSource: record.eventSource
    , eventSourceARN: record.eventSourceARN
    , awsRequestId: context.awsRequestId 
  , recordBody: record.body});

  //const body = await fs.readFileSync("cm-consumer/lambda-handlers/fakes/231116WBR1KI.json", "utf8");
  const e = JSON.parse(record.body);

  const geoId = e?.data?.id ?? e?.geoId;

  logger.warn(e.type);
  switch (e.type) {
    case `${SSotEntityName}.deleted.v1`: { 
      await markGeoAsDeleted({ id: geoId, updateDate: e.data.updateDate, classified: e.data });
      //  id: string, updateDate: any, classified: GeoManagementStructure 
      break;
    }

    case `${SSotEntityName}.created.v1`:
    case `${SSotEntityName}.updated.v1`: {

      const geoObject = e.data as GeoManagementStructure;

      // logger.warn('fifo upsert classified', { 
      //   classifiedId, 
      //   type: e.type, 
      //   data: classifiedObject
      // });

      try {
      
        await createOrUpdateGeo(geoId, e.data, geoObject);
         
      } catch (error) {
        logger.error('Error processing classified', { 
          geoId, 
          type: e.type,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error; // Re-throw to mark the batch item as failed
      }
      break;
    }

    default: {
      // Unmapped event type: fail the record so it lands on the DLQ instead of being silently mis-processed
      throw new Error(`Unsupported event type "${e.type}" for record ${record.messageId}`);
    }
  }
}

export const lambdaHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
  return processPartialResponse(event, async (record: SQSRecord) => {
    return await recordHandler(record, context);
  }, processor, {
    context,
  });
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);