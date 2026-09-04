import { logger } from "@shared/cross-cutting/logger";
import { persistDataInDynamoDB, softDeleteGeoFromReferential } from "./geo-dynamodb";
import { getClassifiedApiSecret } from "../adapters/classified-api-secrets";
import { GeoManagementStructure, GeoLineageFallbackItem } from "@models";
import { transformGeoManagementToGeo } from "./geoMapper";
import createClient from 'openapi-fetch';
import { paths, components } from '../../shared/models/geo-api';
import { Geo, GeoEntityBase, GeoName } from '../../shared/models/geo/1.0.0/geo';
import { Middleware } from 'openapi-fetch';
import { persistGeoFeatureInSQL, persistGeoNamesInSQL, deleteGeoFeature, upsertGeoFeatureNamesRow, persistGeoLineageInSQL } from "./geo-feature-postgres";

// Configuration du client DynamoDB avec SSO pour le développement local
const isLocal = process.env.AWS_EXECUTION_ENV === undefined;

const RELATION_PAGE_LIMIT = 50;


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

type RelationQuery = NonNullable<paths["/relation/{place_id}"]["get"]["parameters"]["query"]>;
type RelationFeature = components["schemas"]["Feature"];

export async function createOrUpdateGeo(id: string, data: any, geo: GeoManagementStructure): Promise<void> {
  let geoData = transformGeoManagementToGeo(geo);

  await enrichGeoData(geoData);

  const tableName = process.env.MV_FEATURE_TABLE_NAME;

  if (!tableName) {
    throw new Error("MV_FEATURE_TABLE_NAME environment variable is not set");
  }
  try {
    await persistDataInDynamoDB(id, geoData, tableName, data?.metadata?.updateDate?.toString() ?? Date.now().toString());
    await persistGeoFeatureInSQL(geoData);
    await persistGeoNamesInSQL(geoData);
    await upsertGeoFeatureNamesRow(geoData.AvivGeoId);

  } catch (error) {
    logger.error("Error upserting geoFeature in Postgres", {
      geoid: id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  async function enrichGeoData(geoData: Geo) {
    const avivGeoId = geo.id;
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

export async function markGeoAsDeleted(deleteCommand: { id: string; updateDate: any; geo: GeoManagementStructure; }): Promise<void> {

  const geoLineage: GeoLineageFallbackItem = {
    AvivGeoId: deleteCommand.geo?.id,
    Fallbacks: deleteCommand.geo.deleted?.fallback
  };

  // Marshalling happens inside persistDataInDynamoDB.
  const tableName = isLocal ? "seo-ssot-classified-fifo" : process.env.MV_LINEAGE_TABLE_NAME;

  if (!tableName) {
    throw new Error("MV_LINEAGE_TABLE_NAME environment variable is not set");
  }
  try {
    await persistDataInDynamoDB(deleteCommand.id, geoLineage, tableName, deleteCommand.updateDate?.toString() ?? Date.now().toString());
    await persistGeoLineageInSQL(geoLineage);
    await deleteGeoFeature(deleteCommand.id);
  } catch (error) {
    logger.error("Error deleting geoFeature in Postgres", {
      geoid: deleteCommand.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const onDayInSeconds = 60 * 60 * 24 * 1;
  const expiryTime = Math.floor(Date.now() / 1000) + onDayInSeconds;

  const updatedTableName = process.env.MV_FEATURE_TABLE_NAME;
  if (!updatedTableName) {
    throw new Error("MV_FEATURE_TABLE_NAME environment variable is not set");
  }

  await softDeleteGeoFromReferential(updatedTableName, deleteCommand.id, deleteCommand.updateDate, expiryTime);
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