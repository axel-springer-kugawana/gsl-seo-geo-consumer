import { SNSClient, PublishBatchCommand } from "@aws-sdk/client-sns";
import { SSoTEntityCreatedEvent, SSoTEntityDeletedEvent, SSoTEntityUpdatedEvent } from "@shared/models/ssot-entity/1.0.0/event-models";
import { config } from "ssot-api/config/configuration-provider";
import { SSoTEvent } from "@shared/models/ssot-entity/1.0.0/ssot-events";
import { uuid } from 'uuidv4';
import { createHash } from 'crypto';
import { logger } from "@shared/cross-cutting/logger";
import { SSoTEntityName } from "@shared/models/ssot-entity/1.0.0/ssot-model";

const snsClient = new SNSClient({});

const publishSSOTEvent = async (ssotEvent: SSoTEvent) => {

    const event = asEventEnvelope(ssotEvent);

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

const asEventEnvelope = (ssotEvent: SSoTEvent) => {

    const commonEventEnvelopeProperties = {
        id: uuid(),
        idempotencykey: hash(JSON.stringify(ssotEvent)),
        specversion: "1.0",
        source: "ssot-producer",
    }

    switch (ssotEvent.eventType) {
        case "Updated":
            return <SSoTEntityUpdatedEvent>{
                ...commonEventEnvelopeProperties,
                type: `${SSoTEntityName}-updated.v1`,
                data: {
                  ...ssotEvent.entity
                }

            }
        case "Created":
            return <SSoTEntityCreatedEvent>{
                ...commonEventEnvelopeProperties,
                type: `${SSoTEntityName}-created.v1` ,
                data: {
                  ...ssotEvent.entity
                }
            }
        case "Deleted":
            return <SSoTEntityDeletedEvent>{
                ...commonEventEnvelopeProperties,
                type: `${SSoTEntityName}-deleted.v1`,
                data: {
                    id: ssotEvent.entity.id
                }
            }
    }
   
}

export const hash = (contents: string) => createHash('md5').update(contents).digest("hex");

export {
    publishSSOTEvent
}
