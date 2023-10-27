import { SNSClient, PublishBatchCommand } from "@aws-sdk/client-sns";
import { SSoTEntityCreatedEvent, SSoTEntityDeletedEvent, SSoTEntityUpdatedEvent } from "@shared/models/ssot-entity/1.0.0/event-models";
import { config } from "ssot-api/config/configuration-provider";
import { SSoTStream } from "@shared/models/ssot-entity/1.0.0/ssot-stream-events";
import { uuid } from 'uuidv4';
import { createHash } from 'crypto';
import { logger } from "@shared/cross-cutting/logger";

const snsClient = new SNSClient({});

const publishSSOTEvent = async (ssotStreamEvent: SSoTStream) => {

    const event = asEventEnvelope(ssotStreamEvent);

    logger.info({
        "message": "publishing message",
        event
    })

    const result = await snsClient.send(new PublishBatchCommand({
        TopicArn: config.get("ssotTopicArn"),
        PublishBatchRequestEntries: [{
            Id: uuid(),
            Message: JSON.stringify(event)
        }]
    }));

}

const asEventEnvelope = (ssotStreamEvent: SSoTStream) => {

    const commonEventEnvelopeProperties = {
        id: uuid(),
        idempotencykey: hash(JSON.stringify(ssotStreamEvent)),
        specversion: "1.0",
        source: "ssot-producer",
    }

    switch (ssotStreamEvent.type) {
        case "Updated":
            return <SSoTEntityUpdatedEvent>{
                ...commonEventEnvelopeProperties,
                type: "classified-updated.v1",
                data: {
                    id: ssotStreamEvent.id,
                    modelVersion: ssotStreamEvent.dataModelVersion,
                    version: ssotStreamEvent.version,
                    property1: ssotStreamEvent.data.prop1,
                    property2: ssotStreamEvent.data.prop2,
                    property3: ssotStreamEvent.data.prop3,
                }

            }
        case "Created":
            return <SSoTEntityCreatedEvent>{
                ...commonEventEnvelopeProperties,
                type: "classified-created.v1",
                data: {
                    id: ssotStreamEvent.id,
                    modelVersion: ssotStreamEvent.dataModelVersion,
                    version: ssotStreamEvent.version,
                    property1: ssotStreamEvent.data.prop1,
                    property2: ssotStreamEvent.data.prop2,
                    property3: ssotStreamEvent.data.prop3,
                }
            }
        case "Deleted":
            return <SSoTEntityDeletedEvent>{
                ...commonEventEnvelopeProperties,
                type: "classified-deleted.v1",
                data: {
                    id: ssotStreamEvent.id
                }
            }
    }
   
}

export const hash = (contents: string) => createHash('sha256').update(contents).digest("hex");

export {
    publishSSOTEvent
}
