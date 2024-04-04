import { mockClient } from 'aws-sdk-client-mock';
import { queueHandler } from "./process-classified-keys";
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SQSEvent } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createFakeSQSEnvelope } from './fakes/create-fake-sqs-envelope';
import { createFakeLambdaContext } from './fakes/fake-lambda-context';
import { sdkStreamifyObject } from './fakes/streamilfySDKResponse';

describe('process classified keys lambda', () => {

    let s3ClientMock;
    let sqsClientMock;

    beforeEach(() => {
        s3ClientMock = mockClient(S3Client);
        sqsClientMock = mockClient(SQSClient);
    })

    afterEach(() => {
        s3ClientMock.reset();
        sqsClientMock.reset();
    });

    test('should should get classified object by key from stow bucket and then send a replay event to cm connector queue when key operation type is "upsert"', async () => {

        const classifiedId = "231111GDUTW1";
        s3ClientMock
            .on(GetObjectCommand)
            .resolves({
                $metadata: {
                    httpStatusCode: 200
                },
                Body: sdkStreamifyObject(await import(`./fakes/classified-object-${classifiedId}.json`))
            });


        // Arrange
        const events = [{
            id: "cabf382d-47d1-43b5-8b82-fff00bad4bcd",
            operation: "upsert",
            keys: [`/ACTIVE/0/IWT/${classifiedId}.json`]
        }];


        const records = events.map(e => createFakeSQSEnvelope(e.id, e));

        const sqsEvent: SQSEvent = {
            Records: records
        }

        // act
        await queueHandler(sqsEvent, createFakeLambdaContext());

        // assert
        const command = sqsClientMock.commandCalls(SendMessageCommand);

        expect(command.length).toBe(1);

        const messageBodyInJson = JSON.parse(command[0].args[0].input.MessageBody);

        expect(messageBodyInJson.source).toBe("classified-management-connector");
        expect(messageBodyInJson.type).toBe("classified.replayed.v1");
        expect(messageBodyInJson.data.classifiedId).toBe(classifiedId);


    });

    test('should should send send a delete event to cm connector queue when key operation type is "delete"', async () => {

        const classifiedId = "231111GDUTW1";
        s3ClientMock
            .on(GetObjectCommand)
            .resolves({
                $metadata: {
                    httpStatusCode: 200
                },
                Body: sdkStreamifyObject(await import(`./fakes/classified-object-${classifiedId}-deleted.json`))
            });


        // Arrange
        const events = [{
            id: "cabf382d-47d1-43b5-8b82-fff00bad4bcd",
            operation: "delete",
            keys: [`/DELETE/0/IWT/${classifiedId}.json`]
        }];


        const records = events.map(e => createFakeSQSEnvelope(e.id, e));

        const sqsEvent: SQSEvent = {
            Records: records
        }

        // act
        await queueHandler(sqsEvent, createFakeLambdaContext());

        // assert
        const command = sqsClientMock.commandCalls(SendMessageCommand);

        expect(command.length).toBe(1);

        const messageBodyInJson = JSON.parse(command[0].args[0].input.MessageBody);

        expect(messageBodyInJson.source).toBe("classified-management-connector");
        expect(messageBodyInJson.type).toBe("classified.deleted.v1");
        expect(messageBodyInJson.data.classifiedId).toBe(classifiedId);


    });

});