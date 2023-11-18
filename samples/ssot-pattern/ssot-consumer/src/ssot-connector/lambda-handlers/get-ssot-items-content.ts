import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { publishDataAsReplayedEvent } from "@ssot-connector/adapters/ssot-replay-event-publisher";
import { getSSOTItem } from "@ssot-connector/adapters/ssot-sotw-store";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";

type ItemsToProcess = { Items: string[] };

export const itemsHandler = async (event: ItemsToProcess): Promise<void> => {

    await Promise.all(event.Items.map(async key => {
        const data = await getSSOTItem(key);
        await publishDataAsReplayedEvent(data)
    }));
}

const processor = new BatchProcessor(EventType.SQS);

export const queueSourceHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {

    return processPartialResponse(event, async (record: SQSRecord) => {
        const content = JSON.parse(record.body) as ItemsToProcess;
        return await itemsHandler(content);
    }, processor, {
        context,
    });
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(itemsHandler);

export const queueHandler = enableLambdaPowertoolsLoggingAndMetrics(queueSourceHandler);

