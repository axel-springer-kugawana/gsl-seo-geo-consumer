import { logger } from "@shared/cross-cutting/logger";
import { ClassifiedWithFullGeo } from "@shared/models/classified/1.0.0/ClassifiedWithFullGeo";
import { mapIsRangePrice_fifo } from '../utils/mappingHelpers';
import { mapGeo_fifo } from '../utils/geoHelpers';

import { DistributionSubTypeBuy} from "cm-consumer/models/classifiedEnums";

import { poolInstance } from "./connectPostGre";
import { Context } from "aws-lambda";
import { isAuthorized_fifo, isGeoDataValid_fifo, isMarketStatusEligibleForPublication_fifo } from '../utils/classfiedRulesHelpers';

import { ClassifiedManagementStructure } from "@models";
//import {mapPortals, mapSpaces, mapPrice, getBrandCountry } from "@utils";
import { mapPortals, mapSpaces, mapPrice, mapFeatures, mapProjectTypes, mapEnergyCertificateClass, getBrandCountry } from "@utils";
import { Location } from "@shared/models/classified/1.0.0/classified";

const markClassifiedAsDeleted = async (context: Context, deleteCommand: { classifiedId: string }): Promise<void> => {
  const { classifiedId } = deleteCommand;
  const values = [classifiedId];
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool

  const query = `DELETE FROM Classified WHERE ClassifiedId=$1`;
  const pool = poolInstance.getPool
  await pool().then(async (_pool) => {
    await _pool.query(query, values);
  });
}

const createOrUpdateClassified = async (context: Context, id: string, classified: ClassifiedManagementStructure): Promise<boolean> => {
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool
  
  const portals = mapPortals(classified.visibility?.validations );

  if (portals.length == 0) {
    return false;
  }

  try {
    
      const { distributionType, spaces, structure, energy, features: { furnished } = {}, estateType } = classified.data
      const brandCountry = getBrandCountry(portals, classified?.data.location.country) 
      

    const pool = poolInstance.getPool
    await pool().then(async (_pool) => {

      const price = mapPrice({ brandCountry, distributionType, prices: classified.data.prices }) ?? undefined;

      const space = mapSpaces(spaces, estateType)[0]; // Units only have one space
      const features = mapFeatures({data: classified.data,media: classified.media, specifics: classified!.specifics     });

      const projectTypes = mapProjectTypes({data:classified!.data,
        metadata: classified!.metadata,
        specifics: classified!.specifics});

      const isGeoDataValidValue = isGeoDataValid_fifo(classified)
      const isMarketStatusEligibleForPublicationValue = isMarketStatusEligibleForPublication_fifo(classified)
      const isAuthorizedValue = isAuthorized_fifo(classified) 
      //map geo by lat lon, then by geoId
      await mapGeo_fifo(_pool, classified?.data?.location as unknown as Location);

      const { avivGeoId, geometry } = classified.data?.location;
      const [lon, lat] = geometry?.coordinates ?? []

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
        portals,
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
        mapEnergyCertificateClass(classified!.data.energy, classified!.classifiedId, logger),
        price == undefined ? false : true,
        mapIsRangePrice_fifo(classified),
        classified.metadata.classifiedBusiness,
        space,
        classified.metadata.projectId,
        classified.metadata?.creationDate ?? null,
        portals.some(x => x === "IMMONET") && classified.metadata?.creationDate != null,
        portals.some(x => x === "IWT") && classified.metadata?.creationDate != null,
        portals.some(x => x === "SL") && classified.metadata?.creationDate != null,
        portals.some(x => x === "LI") && classified.metadata?.creationDate != null,
        classified.data?.structure?.rooms?.numberOfBedRooms,
        classified.data?.texts?.headline?.fr,        
        classified.data?.texts?.headline?.de,
        classified.data?.distributionSubType?.buy === DistributionSubTypeBuy.BUSINESS_SALE_GOODWILL,
        classified.data?.countrySpecific?.fr?.business?.businessSubType,
         classified.data?.structure?.building?.offeredFloors
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
            showPrice,
            isRangePrice,
            classifiedBusiness,
            space,
            ssotupdatedate,
            projectId,
            creationdate,
            isImmonetPortal,
            isImmoweltPortal,
            isSeLogerPortal,
            isLogicImmoPortal,
            numberOfBedRooms,
            headline_fr,
            headline_de,
            issalegoodwill,
            businessSubType,
            building_offeredFloors
            )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, NOW(), $35, $36, $37, $38, $39
          , $40
          , $41
          , $42
          , $43
          , $44
          , $45
          , $46)
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
                showPrice = $31,
                isRangePrice = $32,
                classifiedBusiness=$33,
                space=$34,
                ssotupdatedate= NOW(),
                projectId=$35,
                creationdate=$36,
                isImmonetPortal=$37,
                isImmoweltPortal=$38,
                isSeLogerPortal=$39,
                isLogicImmoPortal=$40,
                numberOfBedRooms=$41,
                headline_fr=$42,
                headline_de=$43,
                isSaleGoodwill=$44,
                businessSubType=$45,
                building_offeredFloors=$46;
                `;
      await _pool.query(classifiedQuery, classifiedValue);
    });
  }
  catch (e) {
    if (e.name === "ConditionalCheckFailedException") {
      logger.warn(e)
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: classified
      })
      return false;
    }
    else {
      logger.error('classifiedId : ' + id)
      logger.error('SQL payload : ' + JSON.stringify(classified))
      logger.error(e)
      throw (e);
    }
  }
  return true;
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
                    neighborhoodid, projecttypes, brand,
                    neighborhoodname, municipalityname,
                    microNeighborhoodId,
                    portals, geo_avivgeoid,
                    showAddress, overallSpace,
                    livingSpace, street, showPrice, isRangePrice, classifiedBusiness, space,
                    creationdate,
                    numberOfBedRooms,
                    headline_fr,
                    headline_de,
                    isSaleGoodwill,
                    businessSubType,
                    building_offeredFloors
            FROM public.v_classified_v2
            where classifiedid = $1;  
              ;`;
      const res = await _pool.query<ClassifiedWithFullGeo>(query, classifiedValue);
      if (res.rows.length > 0) {
        result = res.rows[0];
      }
    });
  }
  catch (e) {
    if (e.name === "ConditionalCheckFailedException") {
      logger.warn(e)
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