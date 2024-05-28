import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { markClassifiedAsDeleted, createOrUpdateClassified } from "cm-consumer/adapters/classifieds-materialized-view-postgre";
import { initDatabase } from "cm-consumer/adapters/initSql";
import * as fs from 'fs';

const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord, context: Context): Promise<void> => {
  //const body = fs.readFileSync("cm-consumer/lambda-handlers/fakes/231116WBR1KI.json", "utf8");
  const e = JSON.parse(record.body);

  switch (e.type) {

    case `${SSotEntityName}.deleted.v1`:
      const classifiedId = e.data.classifiedId;

      await markClassifiedAsDeleted(context, {
        classifiedId, updateDate: e.data.updateDate
      });
      break;
    case `${SSotEntityName}.replayed.v1`:
    case `${SSotEntityName}.updated.v1`:
    case `${SSotEntityName}.created.v1`:
      await createOrUpdateClassified(context, e.data.classifiedId, e.data);
      break;
    case `${SSotEntityName}.init.v1`:
      await initDatabase();
      break;
    default:
      throw new Error(
        `type not managed ${e.type}`
      );
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