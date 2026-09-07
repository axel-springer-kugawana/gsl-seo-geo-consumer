import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { publishFullGeoEvent } from "@cm-connector/adapters/geo-event-publisher-fifo";
import { GeoManagementEvent, GeoEventType } from "@models";
import { logger } from "@shared/cross-cutting/logger";

const handleGeoEvent = async (event: GeoManagementEvent): Promise<void> => {

    logger.info("Handling geo event", { eventType: event.type, eventData: event.data });
     const geoData = event.data;
            
    switch (event.type) {
        case GeoEventType.DELETED:
            await publishFullGeoEvent({
                event: "deleted",
                data: {
                     ...geoData,
                 //   id: geoData.id,
                    updateDate: new Date(event.time).toISOString()
                }
            }); 
            break;
        case GeoEventType.CREATED:
        case GeoEventType.UPDATED:
           await publishFullGeoEvent({
                event: event.type === GeoEventType.CREATED ? "created" : "updated",
                data: {
                    ...geoData,
                    updateDate: new Date(event.time).toISOString()
                }
            });
            break;
        default:
            throw new Error(`cnsumer Unsupported event type: ${event.type}`);
            break;
    }
}
    
const processor = new BatchProcessor(EventType.SQS);

export const queueSourceHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
    // logger.info("Received SQS event", { event });

    return processPartialResponse(event, async (record: SQSRecord) => {
        const geoEvent = JSON.parse(record.body) as GeoManagementEvent;
        //logger.info("Processing geo event", { geoEvent });
        return await handleGeoEvent(geoEvent);

        //logger.info("end of processing geo event", { geoEvent });
    }, processor, {
        context,
    });
}

export const queueHandler = enableLambdaPowertoolsLoggingAndMetrics(queueSourceHandler);

