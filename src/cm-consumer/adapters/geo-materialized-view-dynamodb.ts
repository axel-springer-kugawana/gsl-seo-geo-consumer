import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { logger } from "@shared/cross-cutting/logger";
import { getClassifiedApiSecret } from "../adapters/classified-api-secrets";
import { GeoManagementStructure, GeoLineageFallbackItem } from "@models";
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

  return {
    AvivGeoId: parent.id,
    Code: parent.main_postal_code ?? undefined,
    IsFictive: parent.fictive ?? false,
    Names: mapDtoNames(parent.names ?? {}),
  };
};

// 'version' is the table's static sort key ("V1" | "V2"), known ahead of time, unrelated to
// the lastupdatedate attribute used below for optimistic concurrency.
const DEFAULT_SCHEMA_VERSION = process.env.GEO_DYNAMODB_SCHEMA_VERSION || "V1";

const updateDataInDynamoDB = async (id: string, marshalledData: Record<string, any>, tableName: string, lastUpdateDate: string): Promise<void> => {
  // Build UpdateExpression dynamically, excluding the partition/sort keys (AvivGeoId, version)
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, any> = {};
  const expressionAttributeNames: Record<string, string> = {
    "#LASTUPDATEDATE": "lastupdatedate",
    "#SOFTDELETE": "softdeleted",
    "#EXPIREAT": "expireat"
  };

  // Add geodata attributes to update (excluding partition/sort keys)
  Object.entries(marshalledData).forEach(([key, value]) => {
    if (key !== 'AvivGeoId' && key !== 'Version') {
      const attributeName = `#${key}`;
      const attributeValue = `:${key}`;
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = value;
      updateExpressions.push(`${attributeName} = ${attributeValue}`);
    }
  });

  expressionAttributeValues[":LASTUPDATEDATECURRV"] = { "S": lastUpdateDate };
  updateExpressions.push("#LASTUPDATEDATE = :LASTUPDATEDATECURRV");

  try {
    await ddbClient.send(new UpdateItemCommand({
      TableName: tableName,
      Key: {
        "AvivGeoId": {
          "S": id
        },
        "version": {
          "S": DEFAULT_SCHEMA_VERSION
        }
      },
      UpdateExpression: `
        SET 
          ${updateExpressions.join(',\n          ')}
        REMOVE
          #SOFTDELETE, #EXPIREAT
         `,
      ConditionExpression: "attribute_not_exists(#LASTUPDATEDATE) OR #LASTUPDATEDATE <= :LASTUPDATEDATECURRV",
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
  let geoData = transformGeoManagementToGeo(geo);

  const avivGeoId = geo.id;
  try {
    const geoApiClient = await getGeoApiClient();
    const response = await geoApiClient.GET("/places/{place_id}", {
      params: {
        path: { place_id: avivGeoId },
      }
    });

    if (response.error) {
      throw new Error(`Geo API enrichment failed for ${geo.id}`);
    }

    if (response.data != null) {

      geoData.AvivGeoId = geo.id;
      geoData.Level = response.data.item.level ?? 0;
      geoData.IsFictive = response.data.item.fictive ?? false;
      geoData.Names = mapDtoNames(response.data.item.names ?? {});

      for (const parent of response.data.item.parents ?? []) {
        const mappedParent = mapParentToGeoEntity(parent);

        if (!mappedParent) {
          continue;
        }

        switch (parent.type?.toLowerCase()) {
          case "country":
            geoData.Country = mappedParent;
            break;
          case "macroregion":
            geoData.Macroregion = mappedParent;
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
    logger.error("Error enriching geo from Geo API", {
      id: geo.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;

  }

  const marshalledData = marshall(geoData, { removeUndefinedValues: true });


  const tableName = isLocal ? "seo-ssot-classified-fifo" : process.env.MV_UPDATED_TABLE_NAME;

  if (!tableName) {
    throw new Error("MV_UPDATED_TABLE_NAME environment variable is not set");
  }

  await updateDataInDynamoDB(id, marshalledData, tableName, data?.metadata?.updateDate?.toString() ?? Date.now().toString());
}

let cachedGeoApiClient: ReturnType<typeof createClient<paths>> | null = null;

async function getGeoApiClient() {
  if (cachedGeoApiClient) {
    return cachedGeoApiClient;
  }
  const apisecrets = await getClassifiedApiSecret();
  const cliApi = createClient<paths>({
    baseUrl: `${apisecrets.GeoPlaceApiUrl}/v1`,
  });

  const myMiddleware: Middleware = {
    async onRequest(req, options) {
      req.headers.set("accept", "application/json");
      req.headers.set("X-Api-Key", apisecrets.GeoPlaceApiKey);
      return req;
    }
  };
  cliApi.use(myMiddleware);
  cachedGeoApiClient = cliApi;
  return cliApi;
}

const markGeoAsDeleted = async (deleteCommand: { id: string, updateDate: any, geo: GeoManagementStructure }): Promise<void> => {

  const deletedGeo: GeoLineageFallbackItem = {
    AvivGeoId: deleteCommand.geo?.id,
    Fallbacks: deleteCommand.geo.deleted?.fallback
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

  const updatedTableName = process.env.MV_UPDATED_TABLE_NAME;
  if (!updatedTableName) {
    throw new Error("MV_UPDATED_TABLE_NAME environment variable is not set");
  }

  const removeGeoFromReferentialResult = await ddbClient.send(new UpdateItemCommand({
    TableName: updatedTableName,
    Key: {
      "AvivGeoId": {
        "S": deleteCommand.id
      },
      "version": {
        "S": DEFAULT_SCHEMA_VERSION
      }
    },
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
        "S": deleteCommand.updateDate?.toString()
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
  }));

  if (removeGeoFromReferentialResult.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error deleting item of id: ${deleteCommand.id}`, {
      cause: removeGeoFromReferentialResult.$metadata
    });
  }
}

export {
  createOrUpdateGeo,
  markGeoAsDeleted
}

type RawGeoName = {
  name?: string | null;
  display_name?: string | null;
  slug?: string | null;
  name_rank?: number | null;
  name_root?: string | null;
  name_prefix?: string | null;
  name_prepositions?: { [key: string]: string; } | null;
};

function mapDtoNames(tmp: { [language: string]: RawGeoName[]; }): GeoName[] {
  return Object.entries(tmp).flatMap(([language, localizedNames]) => (localizedNames ?? []).map(name => ({
    DisplayName: name.display_name ?? name.name ?? "",
    Language: language,
    Name: name.name ?? name.display_name ?? "",
    Slug: name.slug ?? "",
  }))
  );
}
