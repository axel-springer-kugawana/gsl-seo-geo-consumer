import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { logger } from "@shared/cross-cutting/logger";
import { getClassifiedApiSecret } from "../adapters/classified-api-secrets";
// import axios from 'axios';
import { GeoManagementStructure } from "@models";
import { transformGeoManagementToGeo } from "./geoMapper";
import { paths, components } from '../../shared/models/geo-api';
import createClient from 'openapi-fetch';
import { GeoEntityBase, GeoName } from '../../shared/models/geo/1.0.0/geo';

import { Middleware } from 'openapi-fetch';


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

const mapParentToGeoEntity = (parent: components["schemas"]["ParentFeature"]): GeoEntityBase | null => {
  if (!parent.id) {
    return null;
  }

  const names: GeoName[] = Object.entries(parent.names ?? {}).flatMap(([language, localizedNames]) =>
    (localizedNames ?? []).map(name => ({
      DisplayName: name.display_name ?? name.name ?? "",
      Language: language,
      Name: name.name ?? name.display_name ?? "",
      Slug: name.slug ?? "",
    }))
  );

  return {
    AvivGeoId: parent.id,
    Code: parent.administrative_code ?? undefined,
    IsFictive: parent.fictive ?? false,
    Names: names,
  };
};

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
        Error: JSON.stringify(e)
      });

      throw e;
    }
  }
}

const createOrUpdateGeo = async (id: string, data: any, geo: GeoManagementStructure): Promise<void> => {
  const geoData = transformGeoManagementToGeo(geo);

  // Marshall the geodata to DynamoDB format
  let marshalledData = marshall(geoData, { removeUndefinedValues: true });

  logger.info("Fetching geo hierarchy enrichment for classified", {
    classifiedId: geo.id,
    geoId: geoData.AvivGeoId
  });

  const avivGeoId = geo.id;
  try {


    logger.info("step 1 : getClassifiedApiSecret");

    const apisecrets = await getClassifiedApiSecret();
    const cliApi = createClient<paths>({
      baseUrl: `${apisecrets.GeoPlaceApiUrl}/v1`,
    })

    logger.info("step 2 : set Middleware for api key", { apisecrets: apisecrets.GeoPlaceApiKey, baseUrl: apisecrets.GeoPlaceApiUrl });

    const myMiddleware: Middleware = {
      async onRequest(req, options) {
        req.headers.set("accept", "application/json");
        req.headers.set("X-Api-Key", apisecrets.GeoPlaceApiKey);
        return req;
      }
    };



    logger.info("step 3: use midddleware for api key", { apisecrets: apisecrets.GeoPlaceApiKey, baseUrl: apisecrets.GeoPlaceApiUrl });


    cliApi.use(myMiddleware);

    logger.info("step 4 : use midddleware for api key", { apisecrets: apisecrets.GeoPlaceApiKey, baseUrl: apisecrets.GeoPlaceApiUrl });
    const {
      data, // only present if 2XX response
      error, // only present if 4XX or 5XX response
    } = await cliApi.GET("/places/{place_id}", {
      params: {
        path: { place_id: avivGeoId },
      }
    });

    logger.info("step 5 : use midddleware for api key", { geoFromApi: data, apisecrets: apisecrets.GeoPlaceApiKey, baseUrl: apisecrets.GeoPlaceApiUrl });


    if (error != null && error != undefined) {

      throw new Error("API response error: " + JSON.stringify(error));
      //logger.error("error while calling api geo for getGeoHierarchyEnrichmentById <<id " + avivGeoId + '>>  trace<<' + JSON.stringify(error) + '>>');
    }
    if (data != null) {
      for (const parent of data.item.parents ?? []) {
        const mappedParent = mapParentToGeoEntity(parent);

        if (!mappedParent) {
          continue;
        }

        switch (parent.type?.toLowerCase()) {
          case "country":
            geoData.Country = mappedParent;
            break;
          case "region":
            geoData.Region = mappedParent;
            break;
          case "province":
            geoData.Province = mappedParent;
            break;
          case "municipality":
          case "city":
            geoData.Municipality = mappedParent;
            break;
        }
      }
    }


  } catch (error) {
    logger.error("error while calling api geo ", {
      id: geo.id,
      error: JSON.stringify(error)
    });
    throw error;

  }

  marshalledData = marshall(geoData, { removeUndefinedValues: true });


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