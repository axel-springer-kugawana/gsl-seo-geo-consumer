import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { getClassifiedById } from "@cm-connector/adapters/classified-api";
import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { publishFullClassifiedEvent } from "@cm-connector/adapters/classified-event-publisher";
import { ClassifiedCreateOrUpdateOrDeleteEvent, ClassifiedEventType } from "@cm-connector/models/1.0.0/classified-events";

const handleClassifiedEvent = async (event: ClassifiedCreateOrUpdateOrDeleteEvent): Promise<void> => {
    switch (event.eventType) {
        case ClassifiedEventType.DELETED:
            await publishFullClassifiedEvent({
                event: "deleted",
                data: {
                    classifiedId: event.classifiedId,
                    updateDate: new Date(event.eventTime).toISOString()
                }
            });
            break;
        case ClassifiedEventType.CREATED:
        case ClassifiedEventType.UPDATED:
            const classified = await getClassifiedById(event.link);
            await publishFullClassifiedEvent({
                event: event.eventType === ClassifiedEventType.CREATED ? "created" : "updated",
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
        const classifiedEvent = JSON.parse(record.body) as ClassifiedCreateOrUpdateOrDeleteEvent;
        return await handleClassifiedEvent(classifiedEvent);
    }, processor, {
        context,
    });
}

export const queueHandler = enableLambdaPowertoolsLoggingAndMetrics(queueSourceHandler);

