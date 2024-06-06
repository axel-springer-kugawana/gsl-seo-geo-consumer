import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { config } from "@cm-connector/config/configuration-provider";
import { ClassifiedKeysSync } from "@cm-connector/models/key-replay-model";


const sqsClient = new SQSClient({});

const publishKeys = async (keys: ClassifiedKeysSync) => {
    await sqsClient.send(new SendMessageCommand({
       QueueUrl: config.get("keysQueueUrl"),
       MessageBody: JSON.stringify(keys)
    }));
}

export {
    publishKeys
}