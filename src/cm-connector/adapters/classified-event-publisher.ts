import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { config } from "@cm-connector/config/configuration-provider";
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { SSoTConsumerName, SSotEntityName } from "@shared/models/cm-consumer-constants";
import { Classified } from "@shared/models/classified/1.0.0/classified";

const sqsClient = new SQSClient({});

type ClassifiedFullEvent= {
    event: "deleted",
    data: {
        classifiedId: string,
        updateDate: string
    }
} | {
    event: "created" | "updated",
    data: Classified

}

const publishFullClassifiedEvent = async (fullEvent: ClassifiedFullEvent) => {

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