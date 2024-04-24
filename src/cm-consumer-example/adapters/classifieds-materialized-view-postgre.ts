import { logger } from "@shared/cross-cutting/logger";
import { Classified } from "@shared/models/classified/1.0.0/classified";
import { Client } from 'pg';
import { mapFeatures, mapPrice } from '../utils/mappingHelpers';
import { getClassifiedApiSecret } from "./classified-api-secrets";
import { paths, components } from '../../shared/models/geo-api';

import createClient from 'openapi-fetch';
import { Middleware } from 'openapi-fetch';


const markClassifiedAsDeleted = async (deleteCommand: { classifiedId: string, updateDate: string }): Promise<void> => {
  const { classifiedId, updateDate } = deleteCommand;
  try {
    const values = [classifiedId];

    const apisecrets = await getClassifiedApiSecret();
    const client = new Client({
      host: apisecrets.Host,
      port: apisecrets.Port,
      user: apisecrets.Username,
      password: apisecrets.Password,
      database: apisecrets.Database,
      connectionTimeoutMillis: 3000
    });

    await client.connect()

    const query = `
    DELETE FROM Classified 
    WHERE ClassifiedId=$1`;

    const res = await client.query(query, values);

    await client.end();
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
}

const createOrUpdateClassified = async (id: string, classified: Classified): Promise<void> => {

  try {

    const apisecrets = await getClassifiedApiSecret();
    const client = new Client({
      host: apisecrets.Host,
      port: apisecrets.Port,
      user: apisecrets.Username,
      password: apisecrets.Password,
      database: apisecrets.Database,
      connectionTimeoutMillis: 3000
    });
    client.connect()

    const price = mapPrice(classified) ?? undefined;
    const features = mapFeatures(classified);
    const geo = await mapGeo(classified);

    let avivGeoId = classified.data?.location.avivGeoId;
    if (geo?.length ?? 0 > 0) {

      let geoLevel = null
      if (avivGeoId === undefined) {
        avivGeoId = geo[geo.length - 1]?.id;
        geoLevel = geo[geo.length - 1]?.level;
      }
      else {
        geoLevel = single(geo.filter(x => x.id === avivGeoId))?.level;
      }

      let countryId = single(geo.filter(x => x.level === 200))?.id;
      let regionId = single(geo.filter(x => x.level === 400))?.id;
      let microregionId = single(geo.filter(x => x.level === 500))?.id;
      let provinceId = single(geo.filter(x => x.level === 600))?.id;
      let municipalityID = single(geo.filter(x => x.level === 800))?.id;
      let boroughID = single(geo.filter(x => x.level === 900))?.id;
      let neighborhoodId = single(geo.filter(x => x.level === 1000))?.id;
      let blocId = single(geo.filter(x => x.level === 1200))?.id;

      const geoValue = [
        avivGeoId,
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
    }
    else {

      console.log("cannot retrieve geo for classified : " + JSON.stringify(classified))
    }
    //Mapping : https://avivgroup.atlassian.net/browse/WLSEO-501
    const classifiedValue = [
      id,
      price,
      avivGeoId,
      classified.data.distributionType,
      classified.data.estateType,
      Object.values(classified.data?.estateSubType)?.[0],
      classified.data?.structure?.rooms?.numberOfRooms,
      classified.data?.features?.furnished,
      classified.data?.conditions?.yearOfConstruction,
      classified.data?.management?.rent?.certificateOfEligibilityNeeded,
      classified.data?.structure?.building?.locationInBuilding,
      features,
      classified.data.location.country,
      classified.metadata.brand,
      classified.visibility.requests.map(e => e.portal),
      classified.data.location.postalcode
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
      Postalcode
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
          Postalcode = $16
          ;`;

    await client.query(classifiedQuery, classifiedValue);

    await client.end();
  }
  catch (e) {
    if (e.name === "ConditionalCheckFailedException") {
      logger.error("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: classified
      })
    } else {
      logger.error(e);
    }

    logger.error(JSON.stringify(classified))
  }
}

export {
  createOrUpdateClassified,
  markClassifiedAsDeleted
}

async function mapGeo(classified: Classified): Promise<Feature[] | undefined> {

  const apiKey = "SMu5gT10PR3MSjzDwgMRS6uyB2WZ5EfNa5EwmT0x"
  //https://avivgroup.atlassian.net/wiki/spaces/AGRS/pages/204505110/AVIV+Geo+Services
  const cliApi = createClient<paths>({
    baseUrl: "https://place-api.cosmic-bullfrog-dev.aws.aviv.eu/",

  })


  const myMiddleware: Middleware = {
    async onRequest(req, options) {
      // set "foo" header
      req.headers.set("X-Api-Key", apiKey);
      return req;
    },
    // async onResponse(res, options) {
    //   const { body, ...resOptions } = res;
    //   // change status of response
    //   return new Response(body, { ...resOptions, status: 200 });
    // },
  };
  cliApi.use(myMiddleware);



  // Path params
  //https://github.com/axel-springer-kugawana/aviv_seeker_classified_search_composer/blob/main/lambdas/src/classified-enrichment/get-geo-hierarchy/main.ts#L37
  const { avivGeoId, geometry } = classified?.data?.location ?? {};
  if (avivGeoId !== undefined) {
    const {
      data, // only present if 2XX response
      error, // only present if 4XX or 5XX response
    } = await cliApi.GET("/v1/places/{place_id}", {
      params: {
        path: { place_id: avivGeoId },
      }
    });

    if (data != null) {
      return [...(data.item.parents ?? []), data.item]
    }
  }

  if (classified?.data?.location?.geometry?.coordinates?.length == 2) {
    // if (geometry?.type === "Point") {
    const [lon, lat] = classified.data.location.geometry.coordinates;
    const {
      data, // only present if 2XX response
      error, // only present if 4XX or 5XX response
    } = await cliApi.GET("/v1/places/point/{longitude}/{latitude}",
      {
        params: {
          path: {
            longitude: lon,
            latitude: lat
          },
        }
      });

    if (data != null) {
      return data.items
    }
  }
  return null
}

type Feature = components['schemas']['Feature'];

function single<T>(a: ReadonlyArray<T>, fallback?: T): T {
  if (a.length === 1) return a[0];
  if (a.length === 0 && fallback !== void 0) return fallback;
  return null;
}