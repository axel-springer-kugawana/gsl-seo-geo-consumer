import { BatchWriteItemCommand, DynamoDBClient, UpdateItemCommand, WriteRequest } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { sendBatchToDynamoDB, sendDeleteBatchToDynamoDB, deleteItemsFromDynamoDB } from './dynamodb-client';

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

    test('deletes only the supplied keys and retries unprocessed deletes', async () => {
        const keys = [{ AvivGeoId: 'old-id', Version: '3.1' }];
        const deletes = [{ DeleteRequest: { Key: { AvivGeoId: { S: 'old-id' }, Version: { S: '3.1' } } } }];
        ddbClientMock.on(BatchWriteItemCommand)
            .resolvesOnce({ UnprocessedItems: { features: deletes } })
            .resolves({});

        const retryCount = await sendDeleteBatchToDynamoDB(new DynamoDBClient({}), 'features', keys);

        const calls = ddbClientMock.commandCalls(BatchWriteItemCommand);
        expect(calls).toHaveLength(2);
        for (const call of calls) {
            expect(call.args[0].input.RequestItems?.features).toEqual(deletes);
        }
        expect(retryCount).toBe(1);
    });

    test('propagates non-retryable delete failures', async () => {
        ddbClientMock.on(BatchWriteItemCommand).rejects(new Error('Access denied'));

        await expect(sendDeleteBatchToDynamoDB(
            new DynamoDBClient({}), 'features', [{ AvivGeoId: 'old-id', Version: '3.1' }],
        )).rejects.toThrow('Access denied');
        expect(ddbClientMock.commandCalls(BatchWriteItemCommand)).toHaveLength(1);
    });

    test('routes hard deletes through batch deletion', async () => {
        ddbClientMock.on(BatchWriteItemCommand).resolves({});

        await deleteItemsFromDynamoDB(new DynamoDBClient({}), 'features', [
            { AvivGeoId: 'old-id', Version: '3.1' },
        ], { mode: 'hard' });

        expect(ddbClientMock.commandCalls(BatchWriteItemCommand)[0].args[0].input.RequestItems?.features).toEqual([
            { DeleteRequest: { Key: { AvivGeoId: { S: 'old-id' }, Version: { S: '3.1' } } } },
        ]);
        expect(ddbClientMock.commandCalls(UpdateItemCommand)).toHaveLength(0);
    });

    test('soft-deletes with TTL and the last update date condition', async () => {
        ddbClientMock.on(UpdateItemCommand).resolves({ $metadata: { httpStatusCode: 200 } });

        await deleteItemsFromDynamoDB(new DynamoDBClient({}), 'features', [
            { AvivGeoId: 'old-id', Version: '3.1' },
        ], { mode: 'soft', updateDate: '2026-11-02T10:00:00Z', expiryTime: 12345 });

        const calls = ddbClientMock.commandCalls(UpdateItemCommand);
        expect(calls).toHaveLength(1);
        expect(calls[0].args[0].input).toEqual({
            TableName: 'features',
            Key: { AvivGeoId: { S: 'old-id' }, Version: { S: '3.1' } },
            UpdateExpression: 'SET #EXPIREAT = :EXPIREAT, #LASTUPDATEDATE = :LASTUPDATEDATECURRV, #SOFTDELETE = :SOFTDELETE',
            ConditionExpression: 'attribute_not_exists(#LASTUPDATEDATE) OR #LASTUPDATEDATE <= :LASTUPDATEDATECURRV',
            ExpressionAttributeValues: {
                ':EXPIREAT': { N: '12345' },
                ':LASTUPDATEDATECURRV': { S: '2026-11-02T10:00:00Z' },
                ':SOFTDELETE': { BOOL: true },
            },
            ExpressionAttributeNames: {
                '#EXPIREAT': 'expireat', '#LASTUPDATEDATE': 'lastupdatedate', '#SOFTDELETE': 'softdeleted',
            },
        });
        expect(ddbClientMock.commandCalls(BatchWriteItemCommand)).toHaveLength(0);
    });

    test('ignores stale soft-delete events without retrying', async () => {
        ddbClientMock.on(UpdateItemCommand).rejects(Object.assign(new Error('Stale event'), {
            name: 'ConditionalCheckFailedException',
        }));

        await expect(deleteItemsFromDynamoDB(new DynamoDBClient({}), 'features', [{ AvivGeoId: 'old-id' }], {
            mode: 'soft', updateDate: '2026-11-02', expiryTime: 12345,
        })).resolves.toBe(0);
        expect(ddbClientMock.commandCalls(UpdateItemCommand)).toHaveLength(1);
    });

    test('retries transient soft-delete errors', async () => {
        ddbClientMock.on(UpdateItemCommand)
            .rejectsOnce(Object.assign(new Error('Throttled'), { name: 'ThrottlingException' }))
            .resolves({ $metadata: { httpStatusCode: 200 } });

        await deleteItemsFromDynamoDB(new DynamoDBClient({}), 'features', [{ AvivGeoId: 'old-id' }], {
            mode: 'soft', updateDate: '2026-11-02', expiryTime: 12345,
        });

        expect(ddbClientMock.commandCalls(UpdateItemCommand)).toHaveLength(2);
    });

    test('propagates non-retryable soft-delete failures', async () => {
        ddbClientMock.on(UpdateItemCommand).rejects(new Error('Access denied'));

        await expect(deleteItemsFromDynamoDB(new DynamoDBClient({}), 'features', [{ AvivGeoId: 'old-id' }], {
            mode: 'soft', updateDate: '2026-11-02', expiryTime: 12345,
        })).rejects.toThrow('Access denied');
    });
});