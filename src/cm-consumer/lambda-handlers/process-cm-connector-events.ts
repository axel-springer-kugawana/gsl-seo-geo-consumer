import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { markClassifiedAsDeleted as markClassifiedAsDeletedPG, createOrUpdateClassified as createOrUpdateClassifiedPG, getClassified } from "cm-consumer/adapters/classifieds-materialized-view-postgre";
import { createOrUpdateClassified as createOrUpdateClassifiedDynamoDB, markClassifiedAsDeleted as markClassifiedAsDeletedDynamoDB } from "cm-consumer/adapters/classifieds-materialized-view-dynamodb";
import { initDatabase, patchDatabase, cleanDatabase } from "cm-consumer/adapters/initSql";
import { logger } from "@shared/cross-cutting/logger";
import { VisibilityStatus } from "@shared/models/classified/1.0.0/classified";


import * as fs from 'fs';

const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord, context: Context): Promise<void> => {

  //const body = await fs.readFileSync("cm-consumer/lambda-handlers/fakes/231116WBR1KI.json", "utf8");
  const e = JSON.parse(record.body);
  const classifiedId = e?.data?.classifiedId ?? e?.classifiedId;

  if (e.type == `${SSotEntityName}.deleted.v1`) {
    await markClassifiedAsDeletedPG(context, { classifiedId, updateDate: e.data.updateDate });
    await markClassifiedAsDeletedDynamoDB({ classifiedId, updateDate: e.data.updateDate });
  }
  else if (e.type == `${SSotEntityName}.init.v1`) {
    await initDatabase();
  } else if (e.type == `${SSotEntityName}.patch`) {
    await patchDatabase();
  }
  else if (e.type == `${SSotEntityName}.clean.v1`) {
    await cleanDatabase();
  }
  else {

    await createOrUpdateClassifiedPG(context, classifiedId, e.data);
    var fullClassified = await getClassified(context, classifiedId);
    if (fullClassified != null) {
      await createOrUpdateClassifiedDynamoDB(classifiedId, e.data, fullClassified);
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