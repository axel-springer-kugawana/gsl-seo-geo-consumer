import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { logger } from "@shared/cross-cutting/logger";
import { createDynamoDBClient } from "@shared/adapters/dynamodb-client";
import { getClassifiedApiSecret } from "../adapters/classified-api-secrets";
import { GeoManagementStructure, GeoLineageFallbackItem } from "@models";
import { transformGeoManagementToGeo } from "./geoMapper";
import { paths, components } from '../../shared/models/geo-api';
import createClient from 'openapi-fetch';
import { Geo, GeoEntityBase, GeoName } from '../../shared/models/geo/1.0.0/geo';
import { Middleware } from 'openapi-fetch';
import { persistGeoFeatureInSQL, persistGeoNamesInSQL, deleteGeoFeature, upsertGeoFeatureNamesRow, persistGeoLineageInSQL } from "./geo-feature-postgres";
import { GEO_DYNAMODB_SCHEMA_VERSION } from "@shared/models/geo-dynamodb-schema-version";

// Configuration du client DynamoDB avec SSO pour le développement local
const isLocal = process.env.AWS_EXECUTION_ENV === undefined;
const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';

const ddbClient = createDynamoDBClient(AWS_REGION);

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

const RELATION_PAGE_LIMIT = 50;
type RelationQuery = NonNullable<paths["/relation/{place_id}"]["get"]["parameters"]["query"]>;
type RelationFeature = components["schemas"]["Feature"];


const persistGeoFeatureInDynamoDB = async (id: string, marshalledData: Record<string, any>, tableName: string, lastUpdateDate: string): Promise<void> => {
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
          "S": GEO_DYNAMODB_SCHEMA_VERSION
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
  
  await enrichGeoData(geoData);

  const marshalledData = marshall(geoData, { removeUndefinedValues: true });
  const tableName = isLocal ? "seo-ssot-classified-fifo" : process.env.MV_FEATURE_TABLE_NAME;

  if (!tableName) {
    throw new Error("MV_FEATURE_TABLE_NAME environment variable is not set");
  }
  try {
    await persistGeoFeatureInDynamoDB(id, marshalledData, tableName, data?.metadata?.updateDate?.toString() ?? Date.now().toString());

    await persistGeoFeatureInSQL(geoData);
    await persistGeoNamesInSQL(geoData);
    await upsertGeoFeatureNamesRow(geoData.AvivGeoId);
 
  } catch (error) {
    logger.error("Error upserting geoFeature in Postgres", {
      geoid: id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  async function enrichGeoData(geoData: Geo) {
    const avivGeoId = geo.id;
    //  let geoFeatureExtra: GeoFeatureExtra | undefined;
    try {
      const geoApiClient = await getGeoApiClient();
      const responsePlaceById = await geoApiClient.GET("/places/{place_id}", {
        params: {
          path: { place_id: avivGeoId },
        }
      });


      let streetIds: string[] = [];

      if (geoData.Type == "municipality") {
        streetIds = await fetchAllRelationPlaceIds(avivGeoId);

      }


      if (responsePlaceById.error) {
        throw new Error(`Geo API enrichment failed for ${geo.id}`);
      }

      if (responsePlaceById.data != null) {

        geoData.AvivGeoId = geo.id;
        geoData.Level = responsePlaceById.data.item.level ?? 0;
        geoData.IsFictive = responsePlaceById.data.item.fictive ?? false;
        geoData.Names = mapDtoNames(responsePlaceById.data.item.names ?? {});

        geoData.StreetIds = streetIds;

        for (const parent of responsePlaceById.data.item.parents ?? []) {
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
            case "street":
              geoData.Street = mappedParent;
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
  }
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

  const geoLineage: GeoLineageFallbackItem = {
    AvivGeoId: deleteCommand.geo?.id,
    Fallbacks: deleteCommand.geo.deleted?.fallback
  };

  // Marshall the geodata to DynamoDB format
  const marshalledData = marshall(geoLineage, { removeUndefinedValues: true });

  const tableName = isLocal ? "seo-ssot-classified-fifo" : process.env.MV_LINEAGE_TABLE_NAME;

  if (!tableName) {
    throw new Error("MV_LINEAGE_TABLE_NAME environment variable is not set");
  }
  try {
    await persistGeoFeatureInDynamoDB(deleteCommand.id, marshalledData, tableName, deleteCommand.updateDate?.toString() ?? Date.now().toString());
    await persistGeoLineageInSQL(geoLineage);
    await deleteGeoFeature(deleteCommand.id);
  } catch (error) {
    logger.error("Error deleting geoFeature in Postgres", {
      geoid: deleteCommand.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const onDayInSeconds = 60 * 60 * 24 * 1;
  const expiryTime = Math.floor(Date.now() / 1000) + onDayInSeconds;

  const updatedTableName = process.env.MV_FEATURE_TABLE_NAME;
  if (!updatedTableName) {
    throw new Error("MV_FEATURE_TABLE_NAME environment variable is not set");
  }

  await softDeleteGeoFromReferential(updatedTableName, deleteCommand.id, deleteCommand.updateDate, expiryTime);
}

// Marks a geo as soft-deleted in the feature table: sets softdeleted/expireat, guarded by the same optimistic-concurrency check as persistGeoFeatureInDynamoDB.
async function softDeleteGeoFromReferential(tableName: string, id: string, updateDate: any, expiryTime: number): Promise<void> {
  const removeGeoFromReferentialResult = await ddbClient.send(new UpdateItemCommand({
    TableName: tableName,
    Key: {
      "AvivGeoId": {
        "S": id
      },
      "version": {
        "S": GEO_DYNAMODB_SCHEMA_VERSION
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
  }));

  if (removeGeoFromReferentialResult.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error deleting item of id: ${id}`, {
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

// Walks every /relation/{place_id} page via keyset pagination, collecting all street ids into a single array.
const fetchAllRelationPlaceIds = async (
  avivGeoId: string
): Promise<string[]> => {
  const placeIds: string[] = [];
  let keyset: number | null | undefined = 0;

  const geoApiClient = await getGeoApiClient();

  while (keyset != null) {
    const query: RelationQuery = {
      keyset,
      place_type: "STRT",
      limit: RELATION_PAGE_LIMIT,
      sort_type: "name",
      sort_order: "ASC",
    };

    const response = await geoApiClient.GET("/relation/{place_id}", {
      params: {
        path: { place_id: avivGeoId },
        query,
      },
    });

    if (response.error) {
      throw new Error(`Geo API relation enrichment failed for ${avivGeoId}`);
    }

    const items: RelationFeature[] = response.data?.items ?? [];
    placeIds.push(...items.map((item) => item.id).filter((id): id is string => !!id));

    keyset = response.data?.metadata.next_page_keyset;
  }

  return placeIds;
};

