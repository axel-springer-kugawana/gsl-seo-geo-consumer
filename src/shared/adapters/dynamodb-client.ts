import {
    BatchWriteItemCommand,
    DynamoDBClient,
    DynamoDBClientConfig,
    WriteRequest,
} from "@aws-sdk/client-dynamodb";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { marshall } from "@aws-sdk/util-dynamodb";
import { isRetryableDynamoDbError } from "./dynamodb-retry";
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