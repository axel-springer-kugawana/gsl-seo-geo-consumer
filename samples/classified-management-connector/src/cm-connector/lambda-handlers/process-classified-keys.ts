import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { getClassifiedByKey } from "@cm-connector/adapters/classified-sotw-store";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { publishClassifiedDataAsReplayedEvent, publishFullClassifiedEvent } from "@cm-connector/adapters/classified-event-publisher";
import { ClassifiedKeysSync } from "@cm-connector/models/key-replay-model";
import { logger } from "@shared/cross-cutting/logger";

const itemsHandler = async (event: ClassifiedKeysSync): Promise<void> => {
    for(let i = 0; i < event.keys.length; i++) {
        const key = event.keys[i];

        
        const classified = await getClassifiedByKey(key);


        switch (event.operation) {
            case "upsert":
                await publishClassifiedDataAsReplayedEvent(classified);
                
                break;
            case "delete":
                await publishFullClassifiedEvent({
                    data: {
                        classifiedId: classified.classifiedId,
                        updateDate: new Date(classified.updateAt).toISOString()
                    },
                    event: "deleted"
                });
                break;
            default:
                logger.warn("Unknown sync operation", {
                    event
                });
        }
    }
}

const processor = new BatchProcessor(EventType.SQS);

export const queueSourceHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {

    return processPartialResponse(event, async (record: SQSRecord) => {
        const content = JSON.parse(record.body) as ClassifiedKeysSync;
        return await itemsHandler(content);
    }, processor, {
        context,
    });
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(itemsHandler);

export const queueHandler = enableLambdaPowertoolsLoggingAndMetrics(queueSourceHandler);

