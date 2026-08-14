import { mockClient } from 'aws-sdk-client-mock';
import { queueHandler } from "./handle-geo-events-fifo";
import { v4 as uuidv4 } from 'uuid';
import { SQSEvent } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createFakeLambdaContext } from './fakes/fake-lambda-context';
import { createFakeSQSEnvelope } from './fakes/create-fake-sqs-envelope';


describe('handle geo event lambda', () => {

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
        const geoId = "NBH1FR1";
        const exepctedResponse = await import(`./fakes/UPDATED_geo-object-${geoId}.json`);


        const events = [{
            id: uuidv4(),
            geoId,
            link: `/IWT/${geoId}`,
            eventTime: 1676537758336,
            type: "geo.updated",
            data: exepctedResponse
        }];

     
        jest
            .spyOn(global, 'fetch')
            .mockImplementation((url: string) => {
              
                if (url.startsWith("http://localhost:2773/secretsmanager/get?secretId=")) {

                    return Promise.resolve({
                        ok: true, status: 200, json: () => Promise.resolve({
                            SecretString: JSON.stringify({
                                ClientId: uuidv4(),
                                Authorization:  uuidv4()
                            })
                        })

                    });
                } else if (url.indexOf(`/IWT/${geoId}`)) {
                    return Promise.resolve({
                        ok: true, status: 200, json: () => Promise.resolve(exepctedResponse)
                    } as any);
                }
            });


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

        expect(messageBodyInJson.source).toBe("geo-management-connector");
        expect(messageBodyInJson.type).toBe("geo.updated.v1");
        expect(messageBodyInJson.data.geoId).toBe(geoId);


    });


    test('should emit classified created event from cm connector when classified created event is received from classified management', async () => {

        // arrange
        const geoId = "NBH1FR1";
          const exepctedResponse = await import(`./fakes/UPDATED_geo-object-${geoId}.json`);

        const events = [{
            id:  uuidv4(),
            geoId,
            link: `/IWT/${geoId}`,
           
              type: "geo.created",
            eventTime: 1676537758336,
            data: exepctedResponse
        }];

        jest
            .spyOn(global, 'fetch')
            .mockImplementation((url: string) => {
              
                if (url.startsWith("http://localhost:2773/secretsmanager/get?secretId=")) {

                    return Promise.resolve({
                        ok: true, status: 200, json: () => Promise.resolve({
                            SecretString: JSON.stringify({
                                ClientId: uuidv4(),
                                Authorization: uuidv4()
                            })
                        })

                    });
                } else if (url.indexOf(`/IWT/${geoId}`)) {
                    return Promise.resolve({
                        ok: true, status: 200, json: () => Promise.resolve(exepctedResponse)
                    } as any);
                }
            });


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

        expect(messageBodyInJson.source).toBe("geo-management-connector");
        expect(messageBodyInJson.type).toBe("geo.created.v1");
        expect(messageBodyInJson.data.geoId).toBe(geoId);
    });
    
    test('should emit classified deleted event from cm connector when classified deleted event is received from classified management', async () => {

        // arrange
        const geoId = "NBH1FR1";
          const exepctedResponse = await import(`./fakes/DELETED_geo-object-${geoId}.json`);
// GeoManagementStructure

        const events = [{
            id:  uuidv4(),
            geoId,
            link: `/IWT/${geoId}`,
            eventTime: 1676537758336,            
            time: 1676537758336,
               type: "geo.deleted",
            data: exepctedResponse
        }];
        // const events = [{
        //     id:  uuidv4(),
        //     geoId,
        //     link: `/IWT/${geoId}`,
        //     eventType: "CREATED",
        //     eventTime: 1676537758336,
        //     data: exepctedResponse
        // }];

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

        expect(messageBodyInJson.source).toBe("geo-management-connector");
        expect(messageBodyInJson.type).toBe("geo.deleted.v1");
        expect(messageBodyInJson.data.geoId).toBe(geoId);


    });


});