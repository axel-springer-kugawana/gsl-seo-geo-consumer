import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { logger } from "@shared/cross-cutting/logger";
import { SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { deleteItem, putItem } from "cm-consumer-example/adapters/classifieds-materialized-view";

const processor = new BatchProcessor(EventType.SQS);

export const recordHandler = async (record: SQSRecord): Promise<void> => {

    const e = JSON.parse(record.body);

    const id = e.data.classifiedId;

    if(e.type === `${SSotEntityName}.deleted.v1`) {
        logger.warn("Deleting item", {
            info: e.data
        });
        await deleteItem(id);
    } 
    else {
      await putItem(id, e.data);
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
