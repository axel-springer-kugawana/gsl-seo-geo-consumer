export const createFakeSQSEnvelope = <TMessageBody>(id: string, messageBody: TMessageBody) => ({
    "messageId": id,
    "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
    "body": `${JSON.stringify(messageBody)}`,
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
});