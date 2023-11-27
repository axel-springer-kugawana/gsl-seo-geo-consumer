import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { Context, DynamoDBBatchResponse, DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import { publishSSOTEvent } from "ssot-api/adapters/ssot-events-publisher";
import { deleteSSoTEntity, putSSoTEntity } from "ssot-api/adapters/ssot-sotw-bucket";
import { SSoTEvent } from "@shared/models/ssot-entity/1.0.0/ssot-events";
import { SSoTEntity } from "@shared/models/ssot-entity/1.0.0/ssot-model";
import { logger } from "@shared/cross-cutting/logger";

const asSSOTEvent = (ddbRecord: DynamoDBRecord): SSoTEvent | undefined => {
    switch (ddbRecord.eventName) {
        case "INSERT":
        case "MODIFY":
            {
                const ssotItemData = ddbRecord.dynamodb?.NewImage?.data.S!;
                return {
                    eventType: ddbRecord.eventName === "INSERT" ? "Created" : "Updated",
                    entity : {
                        ...JSON.parse(ssotItemData) as SSoTEntity,
                    },
                    
                };
            }


        case "REMOVE":
            {
                const ssotItemData = ddbRecord.dynamodb?.OldImage?.data.S!;
                return {
                    eventType: "Deleted",
                    entity: {
                        ...JSON.parse(ssotItemData) as SSoTEntity,
                    },
                };
            }
    }
}


export const recordHandler = async (record: DynamoDBRecord): Promise<void> => {

    const evt = asSSOTEvent(record);

    if (evt == null) {
        return;
    }

    logger.info("ddb stream event handled", {
        evt
    });

    // update state of the world bucket
    if (evt.eventType === "Created" || evt.eventType === "Updated") {
        await putSSoTEntity(evt);
    } else {
        await deleteSSoTEntity(evt);

    }
    // publish event
    await publishSSOTEvent(evt);

}



export const lambdaHandler = async (event: DynamoDBStreamEvent, context: Context): Promise<DynamoDBBatchResponse> => {

    const errors: DynamoDBRecord[] = [];

    for (let i = 0; i < event.Records.length; i++) {
        try {

            await recordHandler(event.Records[i]);

        } catch (error) {
            logger.error("Error occured while handling ddb stream", {
                error
            })
            errors.push(event.Records[i]);
        }
    }

    return {
        batchItemFailures: errors.map(record => {
            return {
                itemIdentifier: record.dynamodb!.SequenceNumber!
            }
        })

    }
}


export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);


