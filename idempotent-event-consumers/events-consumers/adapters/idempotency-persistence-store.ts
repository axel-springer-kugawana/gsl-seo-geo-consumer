import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';

const idempotecyPersistenceStore = new DynamoDBPersistenceLayer({
    tableName: process.env.IDEMPOTENCY_TABLE,
    keyAttr:  process.env.IDEMPOTENCY_TABLE_PARTITION_KEY
});

export {
    idempotecyPersistenceStore
}