import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { getClassifiedByKey } from "@cm-connector/adapters/classified-sotw-store";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { publishClassifiedDataAsReplayedEvent } from "@cm-connector/adapters/classified-event-publisher";

type ItemsToProcess = { Items: string[] };

const itemsHandler = async (event: ItemsToProcess): Promise<void> => {

    for(let i = 0; i < event.Items.length; i++) {

        const key = event.Items[i];
        const classified = await getClassifiedByKey(key);
        await publishClassifiedDataAsReplayedEvent(classified);

    }

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

