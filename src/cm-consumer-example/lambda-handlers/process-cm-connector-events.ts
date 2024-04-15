import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { logger } from "@shared/cross-cutting/logger";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { createOrUpdateClassifiedPostGre } from "cm-consumer-example/adapters/classifieds-materialized-postgre";
import { createFakeSQSEnvelope } from 'cm-connector/lambda-handlers/fakes/create-fake-sqs-envelope';
import * as fs from 'fs';


const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord): Promise<void> => {

    const data = fs.readFileSync("cm-consumer-example/lambda-handlers/fakes/231116WBR1KI.json", "utf8");
    var jsonData = JSON.parse(data);
    const recordFake = createFakeSQSEnvelope("231116WBR1KI", jsonData);
    const e = JSON.parse(recordFake.body);

    const classifiedId = e.classifiedId;
        await createOrUpdateClassifiedPostGre(classifiedId, e.classified);
}

export const lambdaHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {

    return processPartialResponse(event, async (record: SQSRecord) => {
        return await recordHandler(record);
    }, processor, {
        context,
    });
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);
