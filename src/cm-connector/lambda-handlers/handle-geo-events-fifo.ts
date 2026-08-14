import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { publishFullClassifiedEvent } from "@cm-connector/adapters/geo-event-publisher-fifo";
import { GeoManagementEvent, GeoEventType } from "@models";
import { logger } from "@shared/cross-cutting/logger";

const handleClassifiedEvent = async (event: GeoManagementEvent): Promise<void> => {

    logger.info("Handling classified event", { eventType: event.type, eventData: event.data });
     const geoData = event.data;//await getClassifiedById(event.link);
            
    switch (event.type) {
        case GeoEventType.DELETED:
            await publishFullClassifiedEvent({
                event: "deleted",
                data: {
                     ...geoData,
                    id: event.geoId,
                    updateDate: new Date(event.time).toISOString()
                }
            });
            break;
        case GeoEventType.CREATED:
        case GeoEventType.UPDATED:
           await publishFullClassifiedEvent({
                event: event.type === GeoEventType.CREATED ? "created" : "updated",
                data: {
                    ...geoData
                }
            });
            break;
        default:
            throw new Error(`Unsupported event type: ${event.type}`);
            break;
    }
}

const processor = new BatchProcessor(EventType.SQS);

export const queueSourceHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
    // logger.info("Received SQS event", { event });

    return processPartialResponse(event, async (record: SQSRecord) => {
        const geoEvent = JSON.parse(record.body) as GeoManagementEvent;
        //logger.info("Processing geo event", { geoEvent });
        return await handleClassifiedEvent(geoEvent);

        //logger.info("end of processing geo event", { geoEvent });
    }, processor, {
        context,
    });
}

export const queueHandler = enableLambdaPowertoolsLoggingAndMetrics(queueSourceHandler);

