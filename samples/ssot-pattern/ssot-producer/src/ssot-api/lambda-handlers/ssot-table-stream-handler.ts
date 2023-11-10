import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { Context, DynamoDBBatchResponse, DynamoDBRecord, DynamoDBStreamEvent, KinesisStreamRecord } from "aws-lambda";
import { publishSSOTEvent } from "ssot-api/adapters/ssot-events-publisher";
import { deleteSSOTItem, putSSOTItem } from "ssot-api/adapters/ssot-sotw-bucket";
import { SSoTStream } from "@shared/models/ssot-entity/1.0.0/ssot-stream-events";
import { SSoTData } from "@shared/models/ssot-entity/1.0.0/ssot-model";
import { BatchProcessor, EventType, processPartialResponse } from "@aws-lambda-powertools/batch";

const asSSOTEvent = (ddbRecord: DynamoDBRecord): SSoTStream | undefined => {
    switch (ddbRecord.eventName) {
        case "INSERT":
        case "MODIFY":
            {
                const ssotItemId = ddbRecord.dynamodb?.NewImage?.id.S!;
                const ssotItemData = ddbRecord.dynamodb?.NewImage?.data.S!;
                const dataModelVersion = ddbRecord.dynamodb?.NewImage?.dataModelVersion?.S!;
                const version = parseInt(ddbRecord.dynamodb?.NewImage?.version?.N!);
                const partition = ddbRecord.dynamodb?.NewImage?.partition?.S!;
                return {
                    type: ddbRecord.eventName === "INSERT" ? "Created" : "Updated",
                    id: ssotItemId,
                    data: JSON.parse(ssotItemData) as SSoTData,
                    dataModelVersion,
                    partition,
                    version
                };
            }


        case "REMOVE":
            {
                const ssotItemId = ddbRecord.dynamodb?.OldImage?.id.S!;
                const dataModelVersion = ddbRecord.dynamodb?.OldImage?.dataModelVersion?.S!;
                const partition = ddbRecord.dynamodb?.OldImage?.partition?.S!;
                const version = parseInt(ddbRecord.dynamodb?.NewImage?.version?.N!);
                const ssotItemData = ddbRecord.dynamodb?.OldImage?.data.S!;
                return {
                    type: "Deleted",
                    id: ssotItemId,
                    data: JSON.parse(ssotItemData) as SSoTData,
                    dataModelVersion: dataModelVersion,
                    partition,
                    version
                };
            }
    }
}

const processor = new BatchProcessor(EventType.DynamoDBStreams);


export const recordHandler = async (record: DynamoDBRecord): Promise<void> => {
    const evt = asSSOTEvent(record);

    if (!evt) {
        return;
    }

    // update state of the world bucket
    if (evt.type === "Created" || evt.type === "Updated") {
        await putSSOTItem(evt);
    } else {
        await deleteSSOTItem(evt);

    }
    // publish event
    await publishSSOTEvent(evt);
}



export const lambdaHandler = async (event: DynamoDBStreamEvent, context: Context): Promise<DynamoDBBatchResponse> => {
    return processPartialResponse(event, async (record: DynamoDBRecord) => {
        return await recordHandler(record);
    }, processor, {
        context,
    });
}


export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);


