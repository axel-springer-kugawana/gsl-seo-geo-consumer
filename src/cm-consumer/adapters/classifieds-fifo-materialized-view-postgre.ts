import { logger } from "@shared/cross-cutting/logger";
import { ClassifiedWithFullGeo } from "@shared/models/classified/1.0.0/ClassifiedWithFullGeo";
import { mapIsRangePrice_fifo } from '../utils/mappingHelpers';
import { mapGeo } from '../utils/geoHelpers';
import { mapGeoData } from '../utils/mapGeoData';

import { DistributionSubTypeBuy,ClassifiedManagementStructure} from '@models';

import { poolInstance } from "./connectPostGre";
import { Context } from "aws-lambda";
import { isAuthorized_fifo, isGeoDataValid_fifo, isMarketStatusEligibleForPublication_fifo } from '../utils/classfiedRulesHelpers';

import { mapPortals, mapSpaces, mapPrice, mapFeatures, mapProjectTypes, mapEnergyCertificateClass, getBrandCountry } from "@utils";


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
let   classifiedQuery;

  var classifiedValue = new Array<any>();

  if (portals.length == 0) {
    return false;
  }

  try {
    
      const { distributionType, spaces, structure, energy, features: { furnished } = {}, estateType } = classified.data
      const brandCountry2 = getBrandCountry(portals, classified?.data.location.country) 
      

    const pool = poolInstance.getPool
    await pool().then(async (_pool) => {

      const portals = mapPortals(classified!.visibility?.validations)
      const brandCountry = getBrandCountry(portals, classified!.data.location.country)

      const {
      coordinates,
      geoPrecision,
      placeIds,
      debugData: geoDebugData,
      } = mapGeoData({
      classifiedId: classified!.classifiedId,
      geoEnrichment: undefined,
      enrichedData: classified!.enrichedData,
      ssotGeoEnrichmentEnabledBrands :  [],
      ssotGeoEnrichmentPlaceIds: [],
      brandCountry:brandCountry2, 
      logger,
      });

         logger.info('portalsids : ' + placeIds?.join(', '));
      
  const place_ad02 = placeIds?.find(id => id.startsWith('AD02'));//AD02 countryid
  const place_ad03 = placeIds?.find(id => id.startsWith('AD03'));//AD03 macro region id
  const place_ad04 = placeIds?.find(id => id.startsWith('AD04'));//AD04 regionid  
  const place_ad05 = placeIds?.find(id => id.startsWith('AD05'));//ADO5 microregionid
  const place_ad06 = placeIds?.find(id => id.startsWith('AD06'));//AD06 provinceid
  const place_ad08 = placeIds?.find(id => id.startsWith('AD08'));//ADO8 municipalityid
  const place_ad09 = placeIds?.find(id => id.startsWith('AD09'));//AD09 boroughid
  const place_nbh1 = placeIds?.find(id => id.startsWith('NBH1'));//NBH1 boroughid
  const place_nbh2 = placeIds?.find(id => id.startsWith('NBH2'));//NBH2 neighborhoodid
  const place_nbh3 = placeIds?.find(id => id.startsWith('NBH3'));//NBH3 microneighborhoodid
  const place_bloc = placeIds?.find(id => id.startsWith('BLOC'));//bloc 
  const place_strt = placeIds?.find(id => id.startsWith('STRT'));//street
  const place_honu = placeIds?.find(id => id.startsWith('HONU'));//honu

  // if (shouldMap(data, portals)) {

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
       const resolvedAvivGeoId = await mapGeo(_pool, classified);
       const { avivGeoId: rawAvivGeoId, geometry } = classified.data?.location;
       const avivGeoId = resolvedAvivGeoId ?? rawAvivGeoId;
classifiedValue
       = [
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
        coordinates?.lat ?? 0,
        coordinates?.lon ?? 0,
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
        portals.some(x => x === "SL") && classified.metadata?.creationDate != null,
        portals.some(x => x === "LI") && classified.metadata?.creationDate != null,
        classified.data?.structure?.rooms?.numberOfBedRooms,
        classified.data?.texts?.headline?.fr,
        classified.data?.distributionSubType?.buy === DistributionSubTypeBuy.BUSINESS_SALE_GOODWILL,
        classified.data?.countrySpecific?.fr?.business?.businessSubType,
        classified.data?.structure?.building?.offeredFloors,
        classified.data.location.hideNeighborhood ?? false ,
        geoPrecision,
        placeIds,
        place_ad02,
        place_ad03 ,
        place_ad04 ,
        place_ad05 ,
        place_ad06 ,
        place_ad08 ,
        place_ad09 ,
        place_nbh1,
        place_nbh2,
        place_nbh3,
        place_bloc ,
        place_strt,
        place_honu
      ];
s
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
            ssotupdatedate,
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
            place_bloc ,
            place_strt,
            place_honu)
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
            , $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, NOW(), $35, $36, $37, $38
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
                ssotupdatedate= NOW(),
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
                place_bloc = $57,
                place_strt = $58,
                place_honu = $59;
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
      // logger.error('SQL payload : ' + JSON.stringify(classified))

      logger.error('SQL classifiedQuery : ' + JSON.stringify(classifiedQuery))

      logger.error('SQL classifiedValue : ' + JSON.stringify(classifiedValue))  
      
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
                    isSaleGoodwill,
                    businessSubType,
                    building_offeredFloors,
                    hideneighborhood
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