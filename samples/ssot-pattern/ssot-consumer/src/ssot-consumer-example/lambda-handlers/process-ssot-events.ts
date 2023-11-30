import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { logger } from "@shared/cross-cutting/logger";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { putItem } from "ssot-consumer-example/adapters/materialized-view-store";


const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord): Promise<void> => {

    const e = JSON.parse(record.body);
    const id = e.data.id;

    await putItem(id, e.data);

    logger.info("Processing events...",{
        event: JSON.parse(record.body)
    });
}

export const lambdaHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {

    return processPartialResponse(event, async (record: SQSRecord) => {
        return await recordHandler(record);
    }, processor, {
        context,
    });
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);
