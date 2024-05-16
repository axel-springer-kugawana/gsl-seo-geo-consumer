import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { markClassifiedAsDeleted, createOrUpdateClassified } from "cm-consumer/adapters/classifieds-materialized-view-postgre";

const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord, context: Context): Promise<void> => {
  // const body = fs.readFileSync("cm-consumer-example/lambda-handlers/fakes/231116WBR1KI.json", "utf8");
  const e = JSON.parse(record.body);
  const classifiedId = e.data.classifiedId;
  // var pool = await createPoolWithApiSecrets();
  if ((e.type === `${SSotEntityName}.deleted.v1`)) {
    await markClassifiedAsDeleted(context, {
      classifiedId, updateDate: e.data.updateDate
    });
  }
  else {
    await createOrUpdateClassified(context, classifiedId, e.data);
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