import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { markClassifiedAsDeleted as markClassifiedAsDeletedPG, createOrUpdateClassified as createOrUpdateClassifiedPG, getClassified } from "cm-consumer/adapters/classifieds-materialized-view-postgre";
import { createOrUpdateClassified as createOrUpdateClassifiedDynamoDB, markClassifiedAsDeleted as markClassifiedAsDeletedDynamoDB } from "cm-consumer/adapters/classifieds-materialized-view-dynamodb";
import { cleanDatabase, initDatabase, patchDatabase } from "cm-consumer/adapters/initSql";
//import * as fs from 'fs';
const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord, context: Context): Promise<void> => {
  //const body = fs.readFileSync("cm-consumer/lambda-handlers/fakes/231116WBR1KI.json", "utf8");
  const e = JSON.parse(record.body);

  if (e.type == `${SSotEntityName}.deleted.v1`) {
    const classifiedId = e.data.classifiedId;
    await markClassifiedAsDeletedPG(context, { classifiedId, updateDate: e.data.updateDate });
    await markClassifiedAsDeletedDynamoDB({ classifiedId, updateDate: e.data.updateDate });
  }
  else if (e.type == `${SSotEntityName}.init.v1`) {
    await initDatabase();

  }
  else if (e.type == `${SSotEntityName}.patch.v1`) {
    await patchDatabase();
  }
  else if (e.type == `${SSotEntityName}.clean.v1`) {
    await cleanDatabase();

  }
  else {
    await createOrUpdateClassifiedPG(context, e.data.classifiedId, e.data);

    var fullClassified = await getClassified(context, e.data.classifiedId);
    if (fullClassified != null) {
      await createOrUpdateClassifiedDynamoDB(e.data.classifiedId, e.data, fullClassified);
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