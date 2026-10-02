import { BatchWriteItemCommand, DynamoDBClient, WriteRequest } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { sendBatchToDynamoDB } from './dynamodb-client';

const ddbClientMock = mockClient(DynamoDBClient);

const items = [{ LegacyGeoId: '750118.htm' }];
const writeRequests: WriteRequest[] = [{ PutRequest: { Item: { LegacyGeoId: { S: '750118.htm' } } } }];

describe('sendBatchToDynamoDB', () => {
    beforeEach(() => {
        ddbClientMock.reset();
    });

    test('writes the provided batch', async () => {
        ddbClientMock.on(BatchWriteItemCommand).resolves({});

        const retryCount = await sendBatchToDynamoDB(
            new DynamoDBClient({}),
            'legacy-mapping',
            items,
        );

        const calls = ddbClientMock.commandCalls(BatchWriteItemCommand);
        expect(calls).toHaveLength(1);
        expect(calls[0].args[0].input.RequestItems?.['legacy-mapping']).toEqual(writeRequests);
        expect(retryCount).toBe(0);
    });

    test('retries unprocessed items', async () => {
        ddbClientMock
            .on(BatchWriteItemCommand)
            .resolvesOnce({ UnprocessedItems: { 'legacy-mapping': writeRequests } })
            .resolves({});

        const retryCount = await sendBatchToDynamoDB(
            new DynamoDBClient({}),
            'legacy-mapping',
            items,
        );

        expect(ddbClientMock.commandCalls(BatchWriteItemCommand)).toHaveLength(2);
        expect(retryCount).toBe(1);
    });
});