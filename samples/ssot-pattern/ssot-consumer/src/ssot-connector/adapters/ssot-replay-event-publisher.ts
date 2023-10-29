import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { config } from "@ssot-connector/config/configuration-provider";
import { uuid } from 'uuidv4';
import { createHash } from 'crypto';

const sqsClient = new SQSClient({});

const publishDataAsReplayedEvent = async <TSSOTData>(data: TSSOTData) => {

    await sqsClient.send(new SendMessageCommand({
       QueueUrl: config.get("internalSSOTEventsQueueUrl"),
       MessageBody: JSON.stringify(asMessageEnvelope(data))
    }));
}


const asMessageEnvelope = <TSSOTData>(data: TSSOTData) => {

    return {
        id: uuid(),
        idempotencykey: hash(JSON.stringify(data)),
        specversion: "1.0",
        source: "ssot-consumer",
        type: "classified.replayed.v1",
        data: {
            ...data
        }
    }

}

export const hash = (contents: string) => createHash('sha256').update(contents).digest("hex");



export {
    publishDataAsReplayedEvent
}