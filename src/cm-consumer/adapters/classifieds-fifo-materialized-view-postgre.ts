import { logger } from "@shared/cross-cutting/logger";
import { ClassifiedWithFullGeo } from "@shared/models/classified/1.0.0/ClassifiedWithFullGeo";
import { mapIsRangePrice_fifo } from '../utils/mappingHelpers';
import { mapGeoData } from '../utils/mapGeoData';

import { DistributionSubTypeBuy, ClassifiedManagementStructure } from '@models';

import { poolInstance } from "./connectPostGre";
import { Context } from "aws-lambda";
import { isAuthorized_fifo, isGeoDataValid_fifo, isMarketStatusEligibleForPublication_fifo } from '../utils/classfiedRulesHelpers';

import { mapPortals, mapSpaces, mapPrice, mapFeatures, mapProjectTypes, mapEnergyCertificateClass, getBrandCountry } from "@utils";


const markClassifiedAsDeleted = async (context: Context, deleteCommand: { classifiedId: string }): Promise<void> => {
  const { classifiedId } = deleteCommand;
  const values = [classifiedId];
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool

  const query = `DELETE FROM classified_v2 WHERE ClassifiedId=$1`;
  const pool = poolInstance.getPool
  await pool().then(async (_pool) => {
    await _pool.query(query, values);
  });
}

const createOrUpdateClassified = async (context: Context, id: string, classified: ClassifiedManagementStructure, 


  ssotupdatedate: Date,
  externalId : Date
): Promise<boolean> => {
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool

  const portals = mapPortals(classified.visibility?.validations);
  let classifiedQuery = '';

  let classifiedValue = new Array<any>();

  if (portals.length == 0) {
    return false;
  }

  try {

    const { distributionType, spaces, estateType } = classified.data
    const brandCountry2 = getBrandCountry(portals, classified?.data.location.country)


    const pool = poolInstance.getPool
    await pool().then(async (_pool) => {

      const portals = mapPortals(classified!.visibility?.validations)
      const brandCountry = getBrandCountry(portals, classified!.data.location.country)

      const {
        coordinates,
        geoPrecision,
        placeIds,
      } = mapGeoData({
        classifiedId: classified!.classifiedId,
        geoEnrichment: undefined,
        enrichedData: classified!.enrichedData,
        ssotGeoEnrichmentEnabledBrands: [],
        ssotGeoEnrichmentPlaceIds: [],
        brandCountry: brandCountry2,
        logger,
      });

      const place_ad02 = placeIds?.filter(id => id.startsWith('AD02'));//AD02 countryid
      const place_ad03 = placeIds?.filter(id => id.startsWith('AD03'));//AD03 macro region id
      const place_ad04 = placeIds?.filter(id => id.startsWith('AD04'));//AD04 regionid  
      const place_ad05 = placeIds?.filter(id => id.startsWith('AD05'));//ADO5 microregionid
      const place_ad06 = placeIds?.filter(id => id.startsWith('AD06'));//AD06 provinceid
      const place_ad08 = placeIds?.filter(id => id.startsWith('AD08'));//ADO8 municipalityid
      const place_ad09 = placeIds?.filter(id => id.startsWith('AD09'));//AD09 boroughid
      const place_nbh1 = placeIds?.filter(id => id.startsWith('NBH1'));//NBH1 boroughid
      const place_nbh2 = placeIds?.filter(id => id.startsWith('NBH2'));//NBH2 neighborhoodid
      const place_nbh3 = placeIds?.filter(id => id.startsWith('NBH3'));//NBH3 microneighborhoodid
      const place_stu3 = placeIds?.filter(id => id.startsWith('STU3'));//NBH3 microneighborhoodid
      const place_bloc = placeIds?.filter(id => id.startsWith('BLOC'));//bloc 
      const place_strt = placeIds?.filter(id => id.startsWith('STRT'));//street
      const place_honu = placeIds?.filter(id => id.startsWith('HONU'));//honu

      const price = mapPrice({ brandCountry, distributionType, prices: classified.data.prices }) ?? undefined;

      const space = mapSpaces(spaces, estateType)[0]; // Units only have one space
      const features = mapFeatures({ data: classified.data, media: classified.media, specifics: classified!.specifics });

      const projectTypes = mapProjectTypes({
        data: classified!.data,
        metadata: classified!.metadata,
        specifics: classified!.specifics
      });

      const isGeoDataValidValue = isGeoDataValid_fifo(classified)
      const isMarketStatusEligibleForPublicationValue = isMarketStatusEligibleForPublication_fifo(classified)
      const isAuthorizedValue = isAuthorized_fifo(classified)
      classifiedValue
        = [
          id,
          //externalId,
          price,
          null,
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
          coordinates?.lat ?? 0,
          coordinates?.lon ?? 0,
          classified.data?.location?.geometry?.type?.toUpperCase() ?? 'AVIV_GEO_ID',
          projectTypes,
          classified.data.location.showAddress ?? false,
          classified.data.location.street,
          classified.data?.spaces?.residential?.livingSpace,
          classified.data?.spaces?.overallSpace,
          classified.data?.conditions?.buildState,
          mapEnergyCertificateClass(classified!.data.energy, classified!.classifiedId, logger),
          price != undefined,
          mapIsRangePrice_fifo(classified),
          classified.metadata.classifiedBusiness,
          
          space,
          classified.metadata.projectId,
          classified.metadata?.creationDate ?? null,
          portals.includes("SL") && classified.metadata?.creationDate != null,
          portals.includes("LI") && classified.metadata?.creationDate != null,
          classified.data?.structure?.rooms?.numberOfBedRooms,

          classified.data?.texts?.headline?.fr,
          classified.data?.distributionSubType?.buy === DistributionSubTypeBuy.BUSINESS_SALE_GOODWILL,
          classified.data?.countrySpecific?.fr?.business?.businessSubType,
          classified.data?.structure?.building?.offeredFloors,
          classified.data.location.hideNeighborhood ?? false,
          geoPrecision,
          placeIds,
          place_ad02,
          place_ad03,
          place_ad04,
          place_ad05,
          place_ad06,
          place_ad08,
          place_ad09,
          place_nbh1,
          place_nbh2,
          place_nbh3,
          place_stu3,
          place_bloc,
          place_strt,
          place_honu,
          ssotupdatedate,
          externalId
        ];

      classifiedQuery = `
          INSERT INTO classified_v2 (
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
            projectId,
            creationdate,
            isSeLogerPortal,
            isLogicImmoPortal,
            numberOfBedRooms,
            headline_fr,
            issalegoodwill,
            businessSubType,
            building_offeredFloors,
            hideneighborhood,
            geoPrecision,
            placeIds,
            place_ad02 ,
            place_ad03 ,
            place_ad04 ,
            place_ad05 ,
            place_ad06 ,
            place_ad08 ,
            place_ad09 ,
            place_nbh1,
            place_nbh2,
            place_nbh3,
            place_stu3,
            place_bloc,
            place_strt,
            place_honu,
            ssotupdatedate,
            externalId)
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
            , $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,$35, $36, $37, $38
          , $39
          , $40
          , $41
          , $42
          , $43
          , $44
          , $45
          , $46          
          , $47
          , $48
          , $49
          , $50
          , $51
          , $52
          , $53
          , $54
          , $55
          , $56
          , $57
          , $58
          , $59  
          , $60
          , $61
          , $62
          )
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
                projectId=$35,
                creationdate=$36,
                isSeLogerPortal=$37,
                isLogicImmoPortal=$38,
                numberOfBedRooms=$39,
                headline_fr=$40,
                isSaleGoodwill=$41,
                businessSubType=$42,
                building_offeredFloors=$43,
                hideneighborhood=$44,
                geoPrecision=$45,
                placeIds=$46,
                place_ad02 = $47,
                place_ad03 = $48,
                place_ad04 = $49,
                place_ad05 = $50,
                place_ad06 = $51,
                place_ad08 = $52,
                place_ad09 = $53,
                place_nbh1 = $54,
                place_nbh2 = $55,
                place_nbh3 = $56,
                place_stu3 = $57,
                place_bloc = $58,
                place_strt = $59,
                place_honu = $60,
                ssotupdatedate = $61,
                externalId = $62;
                `;
      await _pool.query(classifiedQuery, classifiedValue);
    });
  }
  catch (e) {
    const error = e as any;
    if (error.name === "ConditionalCheckFailedException") {
      logger.warn(error.message || "ConditionalCheckFailedException")
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: classified
      })
      return false;
    }
    else {
      logger.error('classifiedId : ' + id)
      // logger.error('SQL payload : ' + JSON.stringify(classified))

      logger.error('SQL classifiedQuery : ' + JSON.stringify(classifiedQuery))

      logger.error('SQL classifiedValue : ' + JSON.stringify(classifiedValue))

      logger.error(error.message || String(error))
      throw (error);
    }
  }
  return true;
}

const getClassified = async (context: Context, id: string): Promise<ClassifiedWithFullGeo | undefined> => {
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool

  let result = undefined;
  try {

    const pool = poolInstance.getPool
    await pool().then(async (_pool) => {

      const classifiedValue = [id]

      const query = `
            SELECT classifiedid, brand, portals, estatetype, estatesubtype, distributiontype, avivgeoid, country, postalcode, price, numberofrooms, featuresincluded, features, furnished, yearofconstruction, certificateofeligibilityneeded, locationinbuilding, isauthorized, isgeodatavalid, ismarketstatuseligibleforpublication, lat, lon, location_type, projecttypes, showaddress, street, city, spacemin, spacemax, energycertificateclass, buildstate, overallspace, livingspace, classifiedbusiness, showprice, israngeprice, space, updatedate, ssotupdatedate, projectid, creationdate, isselogerportal, islogicimmoportal, numberofbedrooms, headline_fr, issalegoodwill, businesssubtype, building_offeredfloors, hideneighborhood, geoprecision, placeids, place_ad02, place_ad03, place_ad04, place_ad05, place_ad06, place_ad08, place_ad09, place_nbh1, place_nbh2, place_nbh3, place_stu3, place_bloc, place_strt, 
            place_honu,
            externalid,
            ssotupdatedate,
            creationdate
	          FROM public.classified_v2
            where classifiedid = $1;  
              ;`;
      const res = await _pool.query<ClassifiedWithFullGeo>(query, classifiedValue);
      if (res.rows.length > 0) {
        result = res.rows[0];
      }
    });
  }
  catch (e) {
    const error = e as any;
    if (error.name === "ConditionalCheckFailedException") {
      logger.warn(error.message || "ConditionalCheckFailedException")
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: id
      })
    }
    else {
      logger.error('classifiedId : ' + id)
      logger.error(error.message || String(error))
      throw (error);
    }
  }
  return result;
}

export {
  createOrUpdateClassified,
  markClassifiedAsDeleted,
  getClassified
}