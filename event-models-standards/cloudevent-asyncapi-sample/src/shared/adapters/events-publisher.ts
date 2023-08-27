import { EventEnvelope } from '@shared/models/event-model';
import SNS from 'aws-sdk/clients/sns';

const snsClient = new SNS({
    region: process.env.region
});

const publishClassifiedEvent = async <TEventData>(eventEnvelope: TEventData): Promise<void> => {

    await snsClient.publish({
        Message: JSON.stringify(eventEnvelope),
        TopicArn: process.env.CLASSIFIEDS_EVENTS_TOPIC
    })
        .promise();
}


export {
    publishClassifiedEvent
}