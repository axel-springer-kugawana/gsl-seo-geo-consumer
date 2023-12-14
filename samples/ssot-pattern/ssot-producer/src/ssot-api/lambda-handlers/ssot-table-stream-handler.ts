import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { DynamoDBBatchResponse, DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import { publishSSOTEvent } from "ssot-api/adapters/ssot-events-publisher";
import { deleteSSoTEntity, putSSoTEntity } from "ssot-api/adapters/ssot-sotw-bucket";
import { logger } from "@shared/cross-cutting/logger";
import { SsotEntity } from "@shared/models/ssot-entity/models";
import { SsotInternalEvent } from "@shared/models/internal-events";

const asSsotInternalEvent = (ddbRecord: DynamoDBRecord) : SsotInternalEvent | undefined => {
    switch (ddbRecord.eventName) {
        case "INSERT":
        case "MODIFY":
            {
                const ssotItemData = ddbRecord.dynamodb?.NewImage?.data.S!;
                return {
                    eventType: ddbRecord.eventName === "INSERT" ? "Created" : "Updated",
                    entity : {
                        ...JSON.parse(ssotItemData) as SsotEntity,
                    },
                };
            }
        case "REMOVE":
            {
                const ssotItemData = ddbRecord.dynamodb?.OldImage?.data.S!;
                return {
                    eventType: "Deleted",
                    entity: {
                        ...JSON.parse(ssotItemData) as SsotEntity,
                    },
                };
            }
    }
}


export const recordHandler = async (record: DynamoDBRecord): Promise<void> => {

    const evt = asSsotInternalEvent(record);

    if (evt == null) {
        return;
    }

    logger.info("ddb stream event handled", {
        evt
    });

    // update state of the world bucket
    if (evt.eventType === "Created" || evt.eventType === "Updated") {
        await putSSoTEntity(evt.entity);
    } else {
        await deleteSSoTEntity(evt.entity);

    }
    // publish event
    await publishSSOTEvent(evt);

}



export const lambdaHandler = async (event: DynamoDBStreamEvent): Promise<DynamoDBBatchResponse> => {

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


