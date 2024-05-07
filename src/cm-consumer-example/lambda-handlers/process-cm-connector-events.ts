import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
// import { logger } from "@shared/cross-cutting/logger";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";

import { markClassifiedAsDeleted, createOrUpdateClassified } from "cm-consumer-example/adapters/classifieds-materialized-view-postgre";
import { getClassifiedApiSecret } from "../adapters/classified-api-secrets";

import { Pool } from "pg";

import * as fs from 'fs';
const processor = new BatchProcessor(EventType.SQS);

// const createPoolWithApiSecrets = async () => {
//   try {
//     const apisecrets = await getClassifiedApiSecret();
//     const pool = new Pool({
//       max: 1,
//       min: 0,
//       idleTimeoutMillis: 120000,
//       connectionTimeoutMillis: 10000,
//       host: apisecrets.Host,
//       port: apisecrets.Port,
//       user: apisecrets.Username,
//       password: apisecrets.Password,
//       database: apisecrets.Database
//     });

//     return pool;
//   } catch (error) {
//     throw new Error('Erreur when create the pool : ' + error.message);
//   }
// };


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