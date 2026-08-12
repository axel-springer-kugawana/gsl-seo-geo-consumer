import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { config } from "@cm-connector/config/configuration-provider";
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { SSoTConsumerName, SSotEntityName } from "@shared/models/cm-consumer-constants";
import { GeoManagementStructure } from "@models";


const sqsClient = new SQSClient({});

type GeoFullEvent= {
    event: "deleted",
    data: {
        id: string,
        updateDate: string
    }
} | {
    event: "created" | "updated",
    data: GeoManagementStructure

}
 

const publishFullClassifiedEvent = async (fullEvent: GeoFullEvent) => {

    await sqsClient.send(new SendMessageCommand({
        QueueUrl: config.get("connectorEventsQueue"),
        MessageBody: JSON.stringify({
            id: uuidv4(),
            idempotencykey: hash(JSON.stringify(fullEvent)),
            specversion: "1.0",
            source: SSoTConsumerName,
            type: `${SSotEntityName}.${fullEvent.event}.v1`,
            data: fullEvent.data
        })
    }));
}

const publishClassifiedDataAsReplayedEvent = async <TClassifiedData>(data: TClassifiedData) => {

    await sqsClient.send(new SendMessageCommand({
        QueueUrl: config.get("connectorEventsQueue"),
        MessageBody: JSON.stringify({
            id: uuidv4(),
            idempotencykey: hash(JSON.stringify(data)),
            specversion: "1.0",
            source: SSoTConsumerName,
            type: `${SSotEntityName}.replayed.v1`,
            data
        })
    }));
}

export const hash = (contents: string) => createHash('md5').update(contents).digest("hex");

export {
    publishFullClassifiedEvent, 
    publishClassifiedDataAsReplayedEvent
}