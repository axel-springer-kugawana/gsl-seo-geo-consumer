import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
// import { getClassifiedById } from "@cm-connector/adapters/classified-api";
import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { publishFullClassifiedEvent } from "@cm-connector/adapters/classified-event-publisher-fifo";
import { ClassifiedManagementFatSsotEvent, FatEventType } from "@models";

const handleClassifiedEvent = async (event: ClassifiedManagementFatSsotEvent): Promise<void> => {
    switch (event.type) {
        case FatEventType.DELETED:
            await publishFullClassifiedEvent({
                event: "deleted",
                data: {
                    classifiedId: event.data.classifiedId,
                    updateDate: new Date(event.time).toISOString(),
                    externalId: event.data.classifiedId
                }
            });
            break;
        case FatEventType.CREATED:
        case FatEventType.UPDATED:
            const classified = event.data;//await getClassifiedById(event.link);
            await publishFullClassifiedEvent({
                event: event.type === FatEventType.CREATED ? "created" : "updated",
                data: {
                    ...classified
                }
            });
            break;
        default:

            break;
    }
}

const processor = new BatchProcessor(EventType.SQS);

export const queueSourceHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {

    return processPartialResponse(event, async (record: SQSRecord) => {
        const classifiedEvent = JSON.parse(record.body) as ClassifiedManagementFatSsotEvent;
        return await handleClassifiedEvent(classifiedEvent);
    }, processor, {
        context,
    });
}

export const queueHandler = enableLambdaPowertoolsLoggingAndMetrics(queueSourceHandler);

