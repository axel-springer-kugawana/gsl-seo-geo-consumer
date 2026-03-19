import { mockClient } from 'aws-sdk-client-mock';
import { queueHandler } from "./handle-classifieds-events-fifo";
import { v4 as uuidv4 } from 'uuid';
import { SQSEvent } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createFakeLambdaContext } from './fakes/fake-lambda-context';
import { createFakeSQSEnvelope } from './fakes/create-fake-sqs-envelope';


describe('handle classified event lambda', () => {

    let sqsClientMock;

    beforeEach(() => {
         sqsClientMock = mockClient(SQSClient);
    })


    afterEach(() => {
        sqsClientMock.reset();
        jest.resetAllMocks();
    });

    test('should emit classified updated event from cm connector when classified updated event is received from classified management', async () => {

        // arrange
        const classifiedId = "231111GDUTW1";
        const eventId = uuidv4();
        const exepctedResponse = await import(`./fakes/classified-object-${classifiedId}.json`);

        const events = [{
            type: "classified.updated",
            data: exepctedResponse,
            time: new Date(1676537758336).toISOString()
        }];

        const records = events.map(e => createFakeSQSEnvelope(eventId, e));

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
        expect(messageBodyInJson.type).toBe("classified.updated.v1");
        expect(messageBodyInJson.data.classifiedId).toBe(classifiedId);


    });


    test('should emit classified created event from cm connector when classified created event is received from classified management', async () => {

        // arrange
        const classifiedId = "231111GDUTW1";
        const eventId = uuidv4();
        const exepctedResponse = await import(`./fakes/classified-object-${classifiedId}.json`);

        const events = [{
            type: "classified.created",
            data: exepctedResponse,
            time: new Date(1676537758336).toISOString()
        }];

        const records = events.map(e => createFakeSQSEnvelope(eventId, e));

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
        expect(messageBodyInJson.type).toBe("classified.created.v1");
        expect(messageBodyInJson.data.classifiedId).toBe(classifiedId);
    });
    
    test('should emit classified deleted event from cm connector when classified deleted event is received from classified management', async () => {

        // arrange
        const classifiedId = "231111GDUTW1";
        const eventId = uuidv4();
        const events = [{
            type: "classified.deleted",
            data: {
                classifiedId
            },
            time: new Date(1676537758336).toISOString()
        }];

        const records = events.map(e => createFakeSQSEnvelope(eventId, e));

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