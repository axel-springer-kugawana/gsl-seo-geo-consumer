import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { logger } from "@shared/cross-cutting/logger";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
// import { markClassifiedAsDeleted, createOrUpdateClassified } from "cm-consumer-example/adapters/classifieds-materialized-view";
import { createOrUpdateClassified } from "cm-consumer-example/adapters/classifieds-materialized-view-postgre";
import { createFakeSQSEnvelope } from 'cm-connector/lambda-handlers/fakes/create-fake-sqs-envelope';
import * as fs from 'fs';


const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord): Promise<void> => {

    // const body = fs.readFileSync("cm-consumer-example/lambda-handlers/fakes/231116WBR1KI.json", "utf8");

    const e = JSON.parse(record.body);
    const classifiedId = e.data.classifiedId;

    if (!(e.type === `${SSotEntityName}.deleted.v1`)) {
        //     await markClassifiedAsDeleted({
        //         classifiedId, updateDate: e.data.updateDate
        //     });
        // }
        // else {    
        if (!(e.type === `${SSotEntityName}.updated.v1`))
            logger.warn("type => " + e.type);
        // logger.warn("body => " + record.body);
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
