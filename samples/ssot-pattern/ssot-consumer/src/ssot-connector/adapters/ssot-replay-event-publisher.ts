import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { config } from "@ssot-connector/config/configuration-provider";
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { SSoTConsumerName, SSotEntityName } from "@shared/models/ssot-consumer-constants";

const sqsClient = new SQSClient({});

const publishDataAsReplayedEvent = async <TSSOTData>(data: TSSOTData) => {

    await sqsClient.send(new SendMessageCommand({
       QueueUrl: config.get("internalSSOTEventsQueueUrl"),
       MessageBody: JSON.stringify(asMessageEnvelope(data))
    }));
}

const asMessageEnvelope = <TSSOTData>(data: TSSOTData) => {

    return {
        id: uuidv4(),
        idempotencykey: hash(JSON.stringify(data)),
        specversion: "1.0",
        source: SSoTConsumerName,
        type: `${SSotEntityName}.replayed.v1`,
        data: {
            ...data
        }
    }
}

export const hash = (contents: string) => createHash('md5').update(contents).digest("hex");



export {
    publishDataAsReplayedEvent
}