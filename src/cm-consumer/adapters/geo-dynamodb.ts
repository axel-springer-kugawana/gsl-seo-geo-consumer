import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, convertToAttr } from "@aws-sdk/util-dynamodb";
import { logger } from "@shared/cross-cutting/logger";
import { createDynamoDBClient } from "@shared/adapters/dynamodb-client";
import { withDynamoDbRetry } from "@shared/adapters/dynamodb-retry";
import { GEO_DYNAMODB_SCHEMA_VERSION } from "@shared/models/geo-dynamodb-schema-version";

const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';

const ddbClient = createDynamoDBClient(AWS_REGION);

// Partition/sort key shared by every UpdateItemCommand against the feature or lineage table.
const buildGeoKey = (id: string) => marshall({ AvivGeoId: id, version: GEO_DYNAMODB_SCHEMA_VERSION });

// Keys handled separately: AvivGeoId/version are the partition/sort key, softdeleted/expireat/lastupdatedate
// are managed below (removed on upsert, then re-set alongside the optimistic-concurrency check).
const GEO_RESERVED_KEYS = new Set(['AvivGeoId', 'version']);

export const persistDataInDynamoDB = async (id: string, data: Record<string, any>, tableName: string, lastUpdateDate: string): Promise<void> => {
  const marshalledData = marshall(data, { removeUndefinedValues: true });
  const dataEntries = Object.entries(marshalledData).filter(([key]) => !GEO_RESERVED_KEYS.has(key));

  const expressionAttributeNames: Record<string, string> = {
    "#LASTUPDATEDATE": "lastupdatedate",
    "#SOFTDELETE": "softdeleted",
    "#EXPIREAT": "expireat",
    ...Object.fromEntries(dataEntries.map(([key]) => [`#${key}`, key])),
  };

  const expressionAttributeValues: Record<string, any> = {
    ":LASTUPDATEDATECURRV": convertToAttr(lastUpdateDate),
    ...Object.fromEntries(dataEntries.map(([key, value]) => [`:${key}`, value])),
  };

  const setExpression = [
    ...dataEntries.map(([key]) => `#${key} = :${key}`),
    "#LASTUPDATEDATE = :LASTUPDATEDATECURRV",
  ].join(', ');

  try {
    await withDynamoDbRetry(() => ddbClient.send(new UpdateItemCommand({
      TableName: tableName,
      Key: buildGeoKey(id),
      UpdateExpression: `SET ${setExpression} REMOVE #SOFTDELETE, #EXPIREAT`,
      ConditionExpression: "attribute_not_exists(#LASTUPDATEDATE) OR #LASTUPDATEDATE <= :LASTUPDATEDATECURRV",
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames
    })));

  } catch (e: any) {

    if (e.name === "ConditionalCheckFailedException") {
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: marshalledData
      })
      logger.warn(e)
    } else {
      logger.warn("Error While update / creating DynamoDB Record", {
        geoid: id,
        Error: JSON.stringify(e)
      });

      throw e;
    }
  }
}

// Marks a geo as soft-deleted in the feature table: sets softdeleted/expireat, guarded by the same optimistic-concurrency check as persistDataInDynamoDB.
export async function softDeleteGeoFromReferential(tableName: string, id: string, updateDate: any, expiryTime: number): Promise<void> {
  const removeGeoFromReferentialResult = await withDynamoDbRetry(() => ddbClient.send(new UpdateItemCommand({
    TableName: tableName,
    Key: buildGeoKey(id),
    UpdateExpression: `
    SET 
      #EXPIREAT = :EXPIREAT,
      #LASTUPDATEDATE = :LASTUPDATEDATECURRV,
      #SOFTDELETE = :SOFTDELETE`,
    ConditionExpression: "attribute_not_exists(#LASTUPDATEDATE) OR #LASTUPDATEDATE < :LASTUPDATEDATECURRV",
    ExpressionAttributeValues: {
      ":EXPIREAT": {
        "N": expiryTime.toString()
      },
      ":LASTUPDATEDATECURRV": {
        "S": updateDate?.toString()
      },
      ":SOFTDELETE": {
        "BOOL": true
      },
    },
    ExpressionAttributeNames: {
      "#EXPIREAT": "expireat",
      "#LASTUPDATEDATE": "lastupdatedate",
      "#SOFTDELETE": "softdeleted"
    }
  })));

  if (removeGeoFromReferentialResult.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error deleting item of id: ${id}`, {
      cause: removeGeoFromReferentialResult.$metadata
    });
  }
}
