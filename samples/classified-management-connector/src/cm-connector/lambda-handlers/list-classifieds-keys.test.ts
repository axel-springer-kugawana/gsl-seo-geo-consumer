import { mockClient } from 'aws-sdk-client-mock';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createFakeLambdaContext } from './fakes/fake-lambda-context';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { handler } from './list-classified-keys';

describe('list classified keys lambda', () => {

    let s3ClientMock;
    let sqsClientMock;

    beforeEach(() => {
        sqsClientMock = mockClient(SQSClient);
        s3ClientMock = mockClient(S3Client);
    })


    afterEach(() => {
        sqsClientMock.reset();
        s3ClientMock.reset();
        jest.resetAllMocks();
    });

    test('should list keys with continuation token when a next continuation token is provided in the lambda invocation input', async () => {

        // arrange

        const input = {
            nextContinuationToken: "c29tZSBzMyBuZXh0IGNvbnRpbnVhdGlvbiB0b2tlbg==",
            prefix: "/IWT/0/ACTIVE",
            keyBatchingSize: 5
        };

        s3ClientMock
            .on(ListObjectsV2Command)
            .resolves({
                $metadata: {
                    httpStatusCode: 200
                },
                Contents: [{
                    Key: "IWT/0/ACTIVE/12345.json"
                }, {
                    Key: "IWT/0/ACTIVE/23456.json"
                }],
                NextContinuationToken: null,
                IsTruncated: false
            });

        // act
        await handler(input, createFakeLambdaContext(90 * 1000));

        // assert
        const listCommand = s3ClientMock.commandCalls(ListObjectsV2Command);

        expect(listCommand.length).toBe(1);
        expect(listCommand[0].args[0].input.Prefix).toBe(input.prefix);
        expect(listCommand[0].args[0].input.ContinuationToken).toBe(input.nextContinuationToken);

        const sendMessageCommand = sqsClientMock.commandCalls(SendMessageCommand);

        const messageBodyInJson = JSON.parse(sendMessageCommand[0].args[0].input.MessageBody);

        expect(messageBodyInJson).toMatchObject({
            Items: ["IWT/0/ACTIVE/12345.json", "IWT/0/ACTIVE/23456.json"]
        });
    });

    test('should return next continuation token when remaining lambda execution time is less than threshold', async () => {

        // arrange

        const input = {
            nextContinuationToken: "c29tZSBzMyBuZXh0IGNvbnRpbnVhdGlvbiB0b2tlbg==",
            prefix: "/IWT/0/ACTIVE",
            keyBatchingSize: 5
        };

        s3ClientMock
            .on(ListObjectsV2Command)
            .resolves({
                $metadata: {
                    httpStatusCode: 200
                },
                Contents: [{
                    Key: "IWT/0/ACTIVE/12345.json"
                }, {
                    Key: "IWT/0/ACTIVE/23456.json"
                }],
                NextContinuationToken: "YSBuZXh0IGNvbnRpbnVhdGlvbiB0b2tlbiByZXR1cm5lZCBhZnRlciB0aGUgY2FsbCB0aGUgczMgbGlzdCBjb21tYW5k",
                IsTruncated: true
            });

        // act
        const result = await handler(input, createFakeLambdaContext(90));

        // assert
        const listCommand = s3ClientMock.commandCalls(ListObjectsV2Command);

        expect(listCommand.length).toBe(1);
        expect(listCommand[0].args[0].input.Prefix).toBe(input.prefix);
        expect(listCommand[0].args[0].input.ContinuationToken).toBe(input.nextContinuationToken);

        const sendMessageCommand = sqsClientMock.commandCalls(SendMessageCommand);

        const messageBodyInJson = JSON.parse(sendMessageCommand[0].args[0].input.MessageBody);

        expect(messageBodyInJson).toMatchObject({
            Items: ["IWT/0/ACTIVE/12345.json", "IWT/0/ACTIVE/23456.json"]
        });

        expect(result.iterator.nextContinuationToken).toBe("YSBuZXh0IGNvbnRpbnVhdGlvbiB0b2tlbiByZXR1cm5lZCBhZnRlciB0aGUgY2FsbCB0aGUgczMgbGlzdCBjb21tYW5k");
        expect(result.prefix).toBe(input.prefix);
    });


    test('should list keys and publish them to sqs queue', async () => {

        // arrange

        const input = {
            nextContinuationToken: "",
            prefix: "/IWT/0/ACTIVE",
            keyBatchingSize: 5
        };

        s3ClientMock
            .on(ListObjectsV2Command)
            .resolves({
                $metadata: {
                    httpStatusCode: 200
                },
                Contents: [{
                    Key: "IWT/0/ACTIVE/12345.json"
                }, {
                    Key: "IWT/0/ACTIVE/23456.json"
                }],
                NextContinuationToken: null,
                IsTruncated: false
            });

        // act
        await handler(input, createFakeLambdaContext());

        // assert
        const listCommand = s3ClientMock.commandCalls(ListObjectsV2Command);

        expect(listCommand.length).toBe(1);
        expect(listCommand[0].args[0].input.Prefix).toBe(input.prefix);
        expect(listCommand[0].args[0].input.ContinuationToken).toBeNull();

        const sendMessageCommand = sqsClientMock.commandCalls(SendMessageCommand);

        const messageBodyInJson = JSON.parse(sendMessageCommand[0].args[0].input.MessageBody);

        expect(messageBodyInJson).toMatchObject({
            Items: ["IWT/0/ACTIVE/12345.json", "IWT/0/ACTIVE/23456.json"]
        });
    });

});