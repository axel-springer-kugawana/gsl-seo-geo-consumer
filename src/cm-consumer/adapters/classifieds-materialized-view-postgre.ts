import { logger } from "@shared/cross-cutting/logger";
import { Classified, Location, VisibilityStatus } from "@shared/models/classified/1.0.0/classified";
import { mapFeatures, mapPrice } from '../utils/mappingHelpers';
import { mapGeo } from '../utils/geoHelpers';

import { poolInstance } from "./connectPostGre";
import { Context } from "aws-lambda";
import { isAuthorized, isGeoDataValid, isMarketStatusEligibleForPublication, isPublished } from '../utils/classfiedRulesHelpers';

const markClassifiedAsDeleted = async (context: Context, deleteCommand: { classifiedId: string, updateDate: string }): Promise<void> => {
  const { classifiedId, updateDate } = deleteCommand;
  const values = [classifiedId];
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool

  const query = `DELETE FROM Classified WHERE ClassifiedId=$1`;
  const pool = poolInstance.getPool
  await pool().then(async (_pool) => {
    await _pool.query(query, values);
  });
}

const createOrUpdateClassified = async (context: Context, id: string, classified: Classified): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool
  try {

    const pool = poolInstance.getPool
    await pool().then(async (_pool) => {


      const price = mapPrice(classified) ?? undefined;
      const features = mapFeatures(classified);
      const isAuthorizedValue = isAuthorized(classified)
      const isGeoDataValidValue = isGeoDataValid(classified)
      const isMarketStatusEligibleForPublicationValue = isMarketStatusEligibleForPublication(classified)
      const isPublishedValue = isPublished(classified)

      //map geo by lat lon, then by geoId
      let mappedAvivGeoId = isGeoDataValidValue ? await mapGeo(_pool, classified.data?.location) : '';
      const { avivGeoId, geometry } = classified.data?.location;
      const [lon, lat] = geometry?.coordinates ?? []

      const portalFilter = classified?.visibility?.validations?.filter(e => e.visibilityStatus === VisibilityStatus.PUBLISHED || e.visibilityStatus === undefined)
      const classifiedValue = [
        id,
        price,
        mappedAvivGeoId,
        classified.data.distributionType,
        classified.data.estateType,
        classified.data?.estateSubType !== undefined ? Object.values(classified.data?.estateSubType)?.[0] : null,
        classified.data?.structure?.rooms?.numberOfRooms,
        classified.data?.features?.furnished,
        classified.data?.conditions?.yearOfConstruction,
        classified.data?.management?.rent?.certificateOfEligibilityNeeded,
        classified.data?.structure?.building?.locationInBuilding,
        features,
        classified.data?.location?.country,
        classified.metadata.brand,
        //classified?.visibility?.validations?.map(e=>e),
        portalFilter.map(e => e.portal),
        classified?.data?.location?.postalcode,
        isAuthorizedValue,
        isGeoDataValidValue,
        isMarketStatusEligibleForPublicationValue,
        isPublishedValue,
        lat ?? 0,
        lon ?? 0,
        avivGeoId
      ];

      const classifiedQuery = `
        INSERT INTO classified (
          ClassifiedId, 
          Price,
          AvivGeoId, 
          DistributionType, 
          EstateType, 
          EstateSubType, 
          NumberOfRooms,
          Furnished,
          YearOfConstruction,
          CertificateOfEligibilityNeeded,
          LocationInBuilding,
          Features,
          Country,
          Brand,
          Portals,
          Postalcode,
          isAuthorized,
          isGeoDataValid,
          isMarketStatusEligibleForPublication,
          isPublished,
          lat,
          lon,
          avivgeoid_ssot
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,$19, $20, $21, $22,$23)
    ON CONFLICT (ClassifiedId) DO UPDATE 
          SET Price = $2,
              avivgeoId= $3, 
              DistributionType= $4, 
              EstateType= $5, 
              EstateSubType= $6, 
              NumberOfRooms= $7,
              Furnished= $8,
              YearOfConstruction= $9,
              CertificateOfEligibilityNeeded= $10,
              LocationInBuilding= $11,
              Features= $12,
              Country = $13,
              Brand = $14,
              Portals = $15,
              Postalcode = $16,
              isAuthorized = $17,
              isGeoDataValid = $18,
              isMarketStatusEligibleForPublication = $19,
              isPublished = $20,
              lat = $21,
              lon  = $22,
              avivgeoid_ssot = $23;`;
      await _pool.query(classifiedQuery, classifiedValue);
    });
  }
  catch (e) {
    if (e.name === "ConditionalCheckFailedException") {
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: classified
      })
    }
    else {
      logger.error('classifiedId : ' + id)
      logger.error('payload : ' + JSON.stringify(classified))
      logger.error(e)
      throw (e);
    }
  }
}

export {
  createOrUpdateClassified,
  markClassifiedAsDeleted
}

function single<T>(a: ReadonlyArray<T>, fallback?: T): T {
  if (a === undefined) return null;
  if (a.length === 1) return a[0];
  if (a.length === 0 && fallback !== void 0) return fallback;
  return null;
}