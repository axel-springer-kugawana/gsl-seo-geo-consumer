import { SNSClient, PublishBatchCommand } from "@aws-sdk/client-sns";
import { config } from "ssot-api/config/configuration-provider";
import { uuid } from 'uuidv4';
import { createHash } from 'crypto';
import { logger } from "@shared/cross-cutting/logger";
import { SSoTEntityEvents } from "@shared/models/ssot-entity/event-models";
import { SsotInternalEvent } from "@shared/models/internal-events";

const snsClient = new SNSClient({});

const publishSSOTEvent = async (ssotEvent: SsotInternalEvent) => {

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

const asEventEnvelope = (ssotEvent: SsotInternalEvent) : SSoTEntityEvents => {

    const commonEventEnvelopeProperties = {
        id: uuid(),
        idempotencykey: hash(JSON.stringify(ssotEvent)),
        specversion: "1.0" as const,
        source: "ssot-producer",
    }

    switch (ssotEvent.eventType) {
        case "Updated":
            return {
                ...commonEventEnvelopeProperties,
                type: "ssotentity-updated.v1",
                data: {
                  ...ssotEvent.entity
                }

            }
        case "Created":
            return {
                ...commonEventEnvelopeProperties,
                type: `ssotentity-created.v1`,
                specversion: "1.0",
                data: {
                  ...ssotEvent.entity
                }
            }
        case "Deleted":
            return {
                ...commonEventEnvelopeProperties,
                type: `ssotentity-deleted.v1`,
                specversion: "1.0",
                data: {
                    id: ssotEvent.entity.id,
                    metadata: ssotEvent.entity.metadata
                }
            }
    }
   
}

export const hash = (contents: string) => createHash('md5').update(contents).digest("hex");

export {
    publishSSOTEvent
}
