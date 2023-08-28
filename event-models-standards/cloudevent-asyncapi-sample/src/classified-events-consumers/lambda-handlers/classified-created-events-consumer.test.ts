import { lambdaHandler } from "./classified-created-events-consumer";

describe('Consume classified created events lambda handler', () => {

    test('should not report failedItemsFailures when all events are valid', async () => {

        const events = [{
            id: "cabf382d-47d1-6666-8b82-fff00bad4acd",
            type: "classified-created.v1",
            source: "abcd",
            eventcategory: 'IntegrationEvent',
            specversion: "1.0",
            data: {
                classifiedId: "1234",
            }
        }, {
            id: "cabf382d-47d1-43b5-8b82-fff00bad4bcd",
            type: "classified-created.v1",
            source: "abcd",
            eventcategory: 'IntegrationEvent',
            specversion: "1.0",
            data: {
                classifiedId: "456",
            }
        }];

        const records = events.map(e => ({
            "messageId": e.id,
            "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
            "body": `${JSON.stringify(e)}`,
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1545082649183",
                "SenderId": "AIDAIENQZJOLO23YVJ4VO",
                "ApproximateFirstReceiveTimestamp": "1545082649185"
            },
            "messageAttributes": {},
            "md5OfBody": "098f6bcd4621d373cade4e832627b4f6",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-1:111122223333:my-queue",
            "awsRegion": "us-east-1"
        }));


        const res = await lambdaHandler({ Records: records });


        expect(res.batchItemFailures.length).toStrictEqual(0)
    });


    test("should only report invalid events when the required event envelope attribute 'type' is missing", async () => {

        const events = [{
            id: "cabf382d-0000-8888-8b82-fff00bad4acd",
            source: "abcd",
            eventcategory: 'IntegrationEvent',
            specversion: "1.0",
            data: {
                classifiedId: "1234",
            }
        }, {
            id: "cabf382d-47d1-43b5-8b82-fff00bad4bcd",
            type: "classified-created.v1",
            source: "abcd",
            eventcategory: 'IntegrationEvent',
            specversion: "1.0",
            data: {
                classifiedId: "456",
            }
        }];

        const records = events.map(e => ({
            "messageId": e.id,
            "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
            "body": `${JSON.stringify(e)}`,
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1545082649183",
                "SenderId": "AIDAIENQZJOLO23YVJ4VO",
                "ApproximateFirstReceiveTimestamp": "1545082649185"
            },
            "messageAttributes": {},
            "md5OfBody": "098f6bcd4621d373cade4e832627b4f6",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-1:111122223333:my-queue",
            "awsRegion": "us-east-1"
        }));


        const res = await lambdaHandler({ Records: records });

        expect(res.batchItemFailures.length).toStrictEqual(1);
        expect(res.batchItemFailures[0].itemIdentifier).toBe("cabf382d-0000-8888-8b82-fff00bad4acd");

    });



    test("should only report invalid events when the required proeprty on event data is missing", async () => {

        const events = [{
            id: "cabf382d-0000-8888-8b82-fff00bad4acd",
            source: "abcd",
            eventcategory: 'IntegrationEvent',
            specversion: "1.0",
            data: {
                someRandomProperty: "1234",
                bogus: "event"
            }
        }, {
            id: "cabf382d-47d1-43b5-8b82-fff00bad4bcd",
            type: "classified-created.v1",
            source: "abcd",
            eventcategory: 'IntegrationEvent',
            specversion: "1.0",
            data: {
                classifiedId: "456",
            }
        }];

        const records = events.map(e => ({
            "messageId": e.id,
            "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
            "body": `${JSON.stringify(e)}`,
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1545082649183",
                "SenderId": "AIDAIENQZJOLO23YVJ4VO",
                "ApproximateFirstReceiveTimestamp": "1545082649185"
            },
            "messageAttributes": {},
            "md5OfBody": "098f6bcd4621d373cade4e832627b4f6",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-1:111122223333:my-queue",
            "awsRegion": "us-east-1"
        }));


        const res = await lambdaHandler({ Records: records });


        expect(res.batchItemFailures.length).toStrictEqual(1);
        expect(res.batchItemFailures[0].itemIdentifier).toBe("cabf382d-0000-8888-8b82-fff00bad4acd");

    });


});