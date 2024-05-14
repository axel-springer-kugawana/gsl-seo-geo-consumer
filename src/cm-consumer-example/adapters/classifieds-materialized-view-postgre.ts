import { logger } from "@shared/cross-cutting/logger";
import { Classified, Location } from "@shared/models/classified/1.0.0/classified";
import { mapFeatures, mapPrice, mapGeoAsync } from '../utils/mappingHelpers';
import { poolInstance } from "./connectPostGre";
import { Context } from "aws-lambda";

const markClassifiedAsDeleted = async (context: Context, deleteCommand: { classifiedId: string, updateDate: string }): Promise<void> => {
  const { classifiedId, updateDate } = deleteCommand;
  const values = [classifiedId];
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool

  const query = `DELETE FROM Classified WHERE ClassifiedId=$1`;
  const pool = poolInstance.getPool
  pool().then(async (_pool) => {
    const client = await _pool.connect();
    try {
      client.query(query, values);
    }
    catch (e) {
      if (e.name === "ConditionalCheckFailedException") {
        logger.error("Conditional Check failed on lastUpdate date. Classified won't be deleted", {
          classified: classifiedId
        })
      } else {
        logger.error(e);
      }
    }
    finally {
      client.release();
    }
  })
}

const createOrUpdateClassified = async (context: Context, id: string, classified: Classified): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false; // !important to reuse pool
  try {
    const pool = poolInstance.getPool
    pool().then(async (_pool) => {
      const client = await _pool.connect();

      const price = mapPrice(classified) ?? undefined;
      const features = mapFeatures(classified);
      let avivGeoIdWkg = ''
      let doGeoMapping = true;

      const { avivGeoId, geometry } = classified.data?.location;
      const [lon, lat] = geometry?.coordinates ?? [];

      avivGeoIdWkg = avivGeoId;
      if (avivGeoIdWkg !== undefined || geometry !== undefined) {

        const geoQueryExists = `
        select avivgeoid
        from(
        select avivgeoid from geo_lat_lon
        where (lat = $1 and lon = $2)  
        union
        select avivgeoid from geo
        where avivgeoid = $3) tmp`;

        const geoValueExists = [
          lat,
          lon,
          avivGeoIdWkg
        ]

        let existsRecords = (await client.query(geoQueryExists, geoValueExists)).rows[0];
        if (existsRecords?.avivgeoid !== undefined) {
          avivGeoIdWkg = existsRecords.avivgeoid
          doGeoMapping = false;
        }
      }
      if (doGeoMapping) {
        const geo = await mapGeoAsync(classified?.data?.location);
        let geoLevel = null

        if ((geo == undefined || geo.length == 0)) {
          geoLevel = 200
          avivGeoIdWkg = classified?.data?.location?.country ?? "undefined_country"
        }
        else {
          if (avivGeoIdWkg === undefined) {
            avivGeoIdWkg = geo[geo.length - 1]?.id;
            geoLevel = geo[geo.length - 1]?.level;
          }
          else {
            geoLevel = single(geo.filter(x => x.id === avivGeoIdWkg))?.level;
          }
        }
        let countryId = single(geo?.filter(x => x.level === 200))?.id;
        let regionId = single(geo?.filter(x => x.level === 400))?.id;
        let microregionId = single(geo?.filter(x => x.level === 500))?.id;
        let provinceId = single(geo?.filter(x => x.level === 600))?.id;
        let municipalityID = single(geo?.filter(x => x.level === 800))?.id;
        let boroughID = single(geo?.filter(x => x.level === 900))?.id;
        let neighborhoodId = single(geo?.filter(x => x.level === 1000))?.id;
        let blocId = single(geo?.filter(x => x.level === 1200))?.id;

        const geoValue = [
          avivGeoIdWkg,
          geoLevel,
          countryId,
          regionId,
          microregionId,
          provinceId,
          municipalityID,
          boroughID,
          neighborhoodId,
          blocId
        ]
        const geoQuery = `
    INSERT INTO geo (
      avivgeoId,
      geoLevel,
      countryId,
      regionId,
      microregionId,
      provinceId,
      municipalityID,
      boroughID,
      neighborhoodId,
      blocId
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (avivgeoId) DO UPDATE 
      SET    
      geoLevel = $2,
      countryId = $3,
      regionId= $5,
      microregionId= $5,
      provinceId= $6,
      municipalityID= $7,
      boroughID= $9,
      neighborhoodId= $9,
      blocId= $10;`;



        await client.query(geoQuery, geoValue);

        if (lat !== undefined) {
          const geo_lat_lonValue = [
            lat,
            lon,
            avivGeoIdWkg
          ]

          const geo_lat_lon = `
      INSERT INTO geo_lat_lon (lat, lon, avivgeoId) VALUES ($1, $2, $3)
  ON CONFLICT (lat,lon) DO UPDATE 
        SET    
        avivgeoId = $3`;
          await client.query(geo_lat_lon, geo_lat_lonValue);
        }
      }


      //Mapping : https://avivgroup.atlassian.net/browse/WLSEO-501
      const classifiedValue = [
        id,
        price,
        avivGeoIdWkg,
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
        classified?.visibility?.requests.map(e => e.portal),
        classified?.data?.location?.postalcode,
        lat ?? 0,
        lon ?? 0,
      ];

      const classifiedQuery = `
    INSERT INTO Classified (
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
      lat,
      lon
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
          lat = $17,
          lon  = $18          ;`;

      await client.query(classifiedQuery, classifiedValue);


      await client.release();
    })
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