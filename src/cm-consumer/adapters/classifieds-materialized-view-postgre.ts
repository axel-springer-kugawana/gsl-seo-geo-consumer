import { logger } from "@shared/cross-cutting/logger";
import { Classified, Location, VisibilityStatus } from "@shared/models/classified/1.0.0/classified";
import { ClassifiedWithFullGeo } from "@shared/models/classified/1.0.0/ClassifiedWithFullGeo";
import { mapFeatures, mapPrice, mapProjectTypes, mapEnergyCertificateClass } from '../utils/mappingHelpers';
import { mapGeo } from '../utils/geoHelpers';

import { poolInstance } from "./connectPostGre";
import { Context } from "aws-lambda";
import { isAuthorized, isGeoDataValid, isMarketStatusEligibleForPublication } from '../utils/classfiedRulesHelpers';

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
      const projectTypes = mapProjectTypes(classified);
      const isGeoDataValidValue = isGeoDataValid(classified)
      const isMarketStatusEligibleForPublicationValue = isMarketStatusEligibleForPublication(classified)
      const isAuthorizedValue = isAuthorized(classified)

      //map geo by lat lon, then by geoId
      await mapGeo(_pool, classified?.data?.location);
      const { avivGeoId, geometry } = classified.data?.location;
      const [lon, lat] = geometry?.coordinates ?? []

      const portalFilter = classified?.visibility?.validations?.filter(e => e.visibilityStatus === VisibilityStatus.PUBLISHED || e.visibilityStatus === undefined) ?? []
      const classifiedValue = [
        id,
        price,
        avivGeoId,
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
        classified.data?.location?.city,
        classified.metadata.brand,
        portalFilter.map(e => e.portal),
        classified?.data?.location?.postalcode,
        isGeoDataValidValue,
        isMarketStatusEligibleForPublicationValue,
        isAuthorizedValue,
        lat ?? 0,
        lon ?? 0,
        geometry?.type?.toUpperCase() ?? 'AVIV_GEO_ID',
        projectTypes,
        classified.data.location.showAddress ?? false,
        classified.data.location.street,
        classified.data?.spaces?.residential?.livingSpace,
        classified.data?.spaces?.overallSpace,
        classified.data?.conditions?.buildState,
        mapEnergyCertificateClass(classified),
        classified.data?.prices?.showPrice,
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
          City,
          Brand,
          Portals,
          Postalcode,
          isAuthorized,
          isGeoDataValid,
          isMarketStatusEligibleForPublication,
          lat,
          lon,
          location_type,
          projectTypes,
          showAddress,
          street,
          livingSpace,
          overallSpace,
          buildState,
          energyCertificateClass,
          showPrice 
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
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
              City = $14,
              Brand = $15,
              Portals = $16,
              Postalcode = $17,
              isAuthorized = $18,
              isGeoDataValid = $19,
              isMarketStatusEligibleForPublication = $20,
              lat = $21,
              lon  = $22,
              location_type = $23,
              projectTypes =$24,
              showAddress = $25,
              street= $26,
              livingSpace=$27,
              overallSpace=$28,
              buildState =$29,
              energyCertificateClass = $30,
              showPrice = $31;`;
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

const getClassified = async (context: Context, id: string): Promise<ClassifiedWithFullGeo> => {
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool

  let result = undefined;
  try {

    const pool = poolInstance.getPool
    await pool().then(async (_pool) => {

      const classifiedValue = [id]

      const query = `
            SELECT classifiedid, estatetype, 
                    estatesubtype, distributiontype, avivgeoid, location_type, country, city, postalcode,
                    price, numberofrooms, furnished, yearofconstruction, certificateofeligibilityneeded, locationinbuilding, features, isauthorized,
                    isgeodatavalid, ismarketstatuseligibleforpublication, geolevel, countryid, regionid,
                    microregionid, provinceid, municipalityid, boroughid,
                    neighborhoodid, blocid, projecttypes, brand,
                    neighborhoodname, municipalityname,
                    portals, portal, geo_avivgeoid,
                    showAddress, overallSpace,
                    livingSpace, street, showPrice
            FROM public.v_classified
            where classifiedid = $1;
              ;`;
      const res = await _pool.query<ClassifiedWithFullGeo>(query, classifiedValue);
      if (res.rows.length > 0) {
        console.log(res.rows[0]);
        result = res.rows[0];
      }
    });
  }
  catch (e) {
    if (e.name === "ConditionalCheckFailedException") {
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: id
      })
    }
    else {
      logger.error('classifiedId : ' + id)
      logger.error(e)
      throw (e);
    }
  }
  return result;
}

export {
  createOrUpdateClassified,
  markClassifiedAsDeleted,
  getClassified
}