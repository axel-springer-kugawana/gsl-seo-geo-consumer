import {
    BatchWriteItemCommand,
    DynamoDBClient,
    DynamoDBClientConfig,
    UpdateItemCommand,
    WriteRequest,
} from "@aws-sdk/client-dynamodb";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { marshall } from "@aws-sdk/util-dynamodb";
import { isRetryableDynamoDbError, withDynamoDbRetry } from "./dynamodb-retry";
import { logger } from "@shared/cross-cutting/logger";

const isLocal = process.env.AWS_EXECUTION_ENV === undefined;
const MAX_BATCH_WRITE_RETRIES = 5;
export const DYNAMODB_BATCH_WRITE_LIMIT = 25;

// Local dev has no Lambda/ECS execution role, so credentials are pulled from the AWS SSO profile instead.
export function createDynamoDBClient(region: string): DynamoDBClient {
    const config: DynamoDBClientConfig = { region };

    if (isLocal) {
        config.credentials = fromSSO({ profile: 'AvivPowerUserAccessReadWrite-135557783010' });
    }

    return new DynamoDBClient(config);
}

export async function sendBatchToDynamoDB(
    client: DynamoDBClient,
    tableName: string,
    items: Record<string, any>[],
): Promise<number> {
    const writeRequests: WriteRequest[] = items.map((item) => ({
        PutRequest: {
            Item: marshall(item, { removeUndefinedValues: true }),
        },
    }));
    return sendWriteRequestsToDynamoDB(client, tableName, writeRequests);
}

export async function sendDeleteBatchToDynamoDB(
    client: DynamoDBClient,
    tableName: string,
    keys: Record<string, any>[],
): Promise<number> {
    return sendWriteRequestsToDynamoDB(client, tableName, keys.map((key) => ({
        DeleteRequest: { Key: marshall(key) },
    })));
}

export async function deleteItemsFromDynamoDB(
    client: DynamoDBClient,
    tableName: string,
    keys: Record<string, any>[],
    options: { mode: 'hard' } | { mode: 'soft'; updateDate: string; expiryTime: number },
): Promise<number> {
    if (options.mode === 'hard') {
        return sendDeleteBatchToDynamoDB(client, tableName, keys);
    }

    for (const key of keys) {
        try {
            const result = await withDynamoDbRetry(() => client.send(new UpdateItemCommand({
                TableName: tableName,
                Key: marshall(key),
                UpdateExpression: 'SET #EXPIREAT = :EXPIREAT, #LASTUPDATEDATE = :LASTUPDATEDATECURRV, #SOFTDELETE = :SOFTDELETE',
                ConditionExpression: 'attribute_not_exists(#LASTUPDATEDATE) OR #LASTUPDATEDATE <= :LASTUPDATEDATECURRV',
                ExpressionAttributeValues: {
                    ':EXPIREAT': { N: options.expiryTime.toString() },
                    ':LASTUPDATEDATECURRV': { S: options.updateDate?.toString() },
                    ':SOFTDELETE': { BOOL: true },
                },
                ExpressionAttributeNames: {
                    '#EXPIREAT': 'expireat',
                    '#LASTUPDATEDATE': 'lastupdatedate',
                    '#SOFTDELETE': 'softdeleted',
                },
            })));
            if (result.$metadata.httpStatusCode !== 200) {
                throw new Error('Error soft-deleting DynamoDB item', { cause: result.$metadata });
            }
        } catch (error) {
            if ((error as { name?: string })?.name === 'ConditionalCheckFailedException') {
                logger.warn('Conditional Check failed on lastUpdate date. Geo won\'t be soft-deleted', { key });
            } else {
                logger.warn('Error While soft-deleting DynamoDB Record', { key, Error: String(error) });
                throw error;
            }
        }
    }
    return 0;
}

async function  sendWriteRequestsToDynamoDB(
    client: DynamoDBClient,
    tableName: string,
    writeRequests: WriteRequest[],
): Promise<number> {
    let remaining = writeRequests;
    let retryCount = 0;

    while (remaining.length > 0) {
        try {
            const response = await client.send(new BatchWriteItemCommand({
                RequestItems: { [tableName]: remaining },
            }));
            const unprocessed = response.UnprocessedItems?.[tableName];

            if (!unprocessed || unprocessed.length === 0) {
                return retryCount;
            }

            remaining = unprocessed;
            retryCount += 1;
            if (retryCount > MAX_BATCH_WRITE_RETRIES) {
                throw new Error(`DynamoDB batch write failed after ${retryCount} retries (${remaining.length} items remaining).`);
            }
            await delay(200 * retryCount);
        } catch (error) {
            if (!isRetryableDynamoDbError(error)) {
                throw error;
            }

            retryCount += 1;
            if (retryCount > MAX_BATCH_WRITE_RETRIES) {
                throw error;
            }
            await delay(200 * 2 ** retryCount);
        }
    }

    if (retryCount > 1) {
        logger.warn(`[ECS Task] Batch write needed ${retryCount} retry(ies) (throttling/warmup).`);
    }
    return retryCount;
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}