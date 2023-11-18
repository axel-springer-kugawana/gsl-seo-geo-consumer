import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { config } from "@ssot-connector/config/configuration-provider";


const sqsClient = new SQSClient({});

const publishKeys = async (keys: { Items : string[]}) => {

    await sqsClient.send(new SendMessageCommand({
       QueueUrl: config.get("keysQueueUrl"),
       MessageBody: JSON.stringify(keys)
    }));
}

export {
    publishKeys
}