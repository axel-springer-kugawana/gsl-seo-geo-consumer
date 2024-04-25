import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
// import { logger } from "@shared/cross-cutting/logger";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";

import { markClassifiedAsDeleted, createOrUpdateClassified } from "cm-consumer-example/adapters/classifieds-materialized-view-postgre";
import * as fs from 'fs';
const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord): Promise<void> => {
    const body = fs.readFileSync("cm-consumer-example/lambda-handlers/fakes/231116WBR1KI.json", "utf8");
    const e = JSON.parse(body);
    const classifiedId = e.data.classifiedId;

    if ((e.type === `${SSotEntityName}.deleted.v1`)) {
        await markClassifiedAsDeleted({
            classifiedId, updateDate: e.data.updateDate
        });
    }
    else {
        await createOrUpdateClassified(classifiedId, e.data);
    }
}

export const lambdaHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
    return processPartialResponse(event, async (record: SQSRecord) => {
        return await recordHandler(record);
    }, processor, {
        context,
    });
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);