import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { logger } from "@shared/cross-cutting/logger";

import { GeoManagementStructure } from "@models";
import { transformGeoManagementToGeo } from "./transformGeoManagementToGeo";
// Configuration du client DynamoDB avec SSO pour le développement local
const isLocal = process.env.AWS_EXECUTION_ENV === undefined;

const ddbClient = new DynamoDBClient(
  isLocal
    ? {
      region: process.env.AWS_REGION || 'eu-central-1',
      credentials: fromSSO({
        profile: 'AvivPowerUserAccessReadWrite-135557783010',
      }),
    }
    : {}
);

const updateDataInDynamoDB = async (id: string, marshalledData: Record<string, any>, tableName: string, versionValue: string): Promise<void> => {
  // Build UpdateExpression dynamically, excluding the partition key (AvivGeoId)
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, any> = {};
  const expressionAttributeNames: Record<string, string> = {
    "#VERSIONATTN": "version",
    "#SOFTDELETE": "softdeleted",
    "#EXPIREAT": "expireat"
  };

  // Add geodata attributes to update (excluding partition key)
  Object.entries(marshalledData).forEach(([key, value]) => {
    if (key !== 'AvivGeoId') { // Skip the partition key
      const attributeName = `#${key}`;
      const attributeValue = `:${key}`;
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = value;
      updateExpressions.push(`${attributeName} = ${attributeValue}`);
    }
  });

  // Add version attribute
  // const versionValue = data?.metadata?.updateDate?.toString() ?? Date.now().toString();
  expressionAttributeValues[":VERSIONATTCURRV"] = { "S": versionValue };
  updateExpressions.push("#VERSIONATTN = :VERSIONATTCURRV");

  try {
    await ddbClient.send(new UpdateItemCommand({
      TableName: tableName,
      Key: {
        "AvivGeoId": {
          "S": id
        }
      },
      UpdateExpression: `
        SET 
          ${updateExpressions.join(',\n          ')}
        REMOVE
          #SOFTDELETE, #EXPIREAT
         `,
      ConditionExpression: "attribute_not_exists(#VERSIONATTN) OR #VERSIONATTN <= :VERSIONATTCURRV",
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames
    }));

  } catch (e: any) {

    if (e.name === "ConditionalCheckFailedException") {
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: marshalledData
      })
      logger.warn(e)
    } else {
      logger.warn("Error While update / creating DynamoDB Record", {
        geoid: id,
        Error : JSON.stringify(e)
      });

      throw e;
    }
  }
}

const createOrUpdateGeo = async (id: string, data: any, classified: GeoManagementStructure): Promise<void> => {
  const geoData = transformGeoManagementToGeo(classified);

  // Marshall the geodata to DynamoDB format
  const marshalledData = marshall(geoData, { removeUndefinedValues: true });

  const tableName = isLocal ? "seo-ssot-classified-fifo" : process.env.MV_UPDATED_TABLE_NAME;

  if (!tableName) {
    throw new Error("MV_UPDATED_TABLE_NAME environment variable is not set");
  }

  await updateDataInDynamoDB(id, marshalledData, tableName, data?.metadata?.updateDate?.toString() ?? Date.now().toString());
}

const markDataAsDeleted = async (deleteCommand: { id: string, updateDate: any, geo: GeoManagementStructure }): Promise<void> => {

  var deletedGeo = {
    AvivGeoId: deleteCommand.geo?.id,
    Version: deleteCommand.updateDate?.toString(),
    Fallbacks: deleteCommand.geo.deleted?.fallback,
    //  release_date: deleteCommand.geo.deleted?.release_date,
    Type: deleteCommand.geo?.type,
  };

  // Marshall the geodata to DynamoDB format
  const marshalledData = marshall(deletedGeo, { removeUndefinedValues: true });

  const tableName = isLocal ? "seo-ssot-classified-fifo" : process.env.MV_DELETED_TABLE_NAME;

  if (!tableName) {
    throw new Error("MV_DELETED_TABLE_NAME environment variable is not set");
  }

  await updateDataInDynamoDB(deleteCommand.id, marshalledData, tableName, deleteCommand.updateDate?.toString() ?? Date.now().toString());

  const onDayInSeconds = 60 * 60 * 24 * 1;
  const expiryTime = Math.floor(Date.now() / 1000) + onDayInSeconds;

  const removeGeoFromReferentialResult = await ddbClient.send(new UpdateItemCommand({
    TableName: process.env.MV_UPDATED_TABLE_NAME,
    Key: {
      "AvivGeoId": {
        "S": deleteCommand.id
      }
    },
    UpdateExpression: `
    SET 
      #EXPIREAT = :EXPIREAT,
      #VERSIONATTN = :VERSIONATTCURRV,
      #SOFTDELETE = :SOFTDELETE`,
    ConditionExpression: "attribute_not_exists(#VERSIONATTN) OR #VERSIONATTN < :VERSIONATTCURRV",
    ExpressionAttributeValues: {
      ":EXPIREAT": {
        "N": expiryTime.toString()
      },
      ":VERSIONATTCURRV": {
        "S": deleteCommand.updateDate?.toString()
      },
      ":SOFTDELETE": {
        "BOOL": true
      },
    },
    ExpressionAttributeNames: {
      "#EXPIREAT": "expireat",
      "#VERSIONATTN": "version",
      "#SOFTDELETE": "softdeleted"
    }
  }));

  if (removeGeoFromReferentialResult.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error deleting item of id: ${deleteCommand.id}`, {
      cause: removeGeoFromReferentialResult.$metadata
    });
  }
}

export {
  createOrUpdateGeo,
  markDataAsDeleted as markGeoAsDeleted
}