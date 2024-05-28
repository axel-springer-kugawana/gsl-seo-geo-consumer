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

  if (e.type == `${SSotEntityName}.deleted.v1`) {
    const classifiedId = e.data.classifiedId;
    await markClassifiedAsDeleted(context, { classifiedId, updateDate: e.data.updateDate });

  }
  else if (e.type == `${SSotEntityName}.init.v1`) {
    await initDatabase();

  }
  else {

    console.log('classifiedId : ' + e.type)
    console.log('classifiedId : ' + e.data.classifiedId)

    console.log(JSON.stringify(record.body))
    

    await createOrUpdateClassified(context, e.data.classifiedId, e.data);

  }

  // switch (e.type) {
  //   case `${SSotEntityName}.deleted.v1`:
  //     const classifiedId = e.data.classifiedId;
  //     await markClassifiedAsDeleted(context, { classifiedId, updateDate: e.data.updateDate });
  //     break;
  //   case `${SSotEntityName}.init.v1`:
  //     await initDatabase();
  //     break;
  //   default:
  //     await createOrUpdateClassified(context, e.data.classifiedId, e.data);
  // }
}

export const lambdaHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
  return processPartialResponse(event, async (record: SQSRecord) => {
    return await recordHandler(record, context);
  }, processor, {
    context,
  });
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);