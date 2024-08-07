import { paths, components } from '../../shared/models/geo-api';
import createClient from 'openapi-fetch';
import { Middleware } from 'openapi-fetch';
import { Pool } from "pg";
import { getClassifiedApiSecret } from "../adapters/classified-api-secrets";
import { Location } from '@shared/models/classified/1.0.0/classified';
import { logger } from "@shared/cross-cutting/logger";
export const mapGeo = async (_pool: Pool, location: Location): Promise<string> => {
    let avivGeoId = await mapGeoFromCache(_pool, location);
    if (avivGeoId === undefined) {
        avivGeoId = await mapGeoFromApi(_pool, location);
    }
    return avivGeoId;
}

async function mapGeoFromCache(_pool: Pool, location: Location) {
    const { avivGeoId, geometry } = location;
    //var geo = await getGeoHierarchyEnrichmentByCoordinates(location);
    //await addGeoToCacheAsync(_pool, geo, "DDAD4", location);

    let mappedAvivGeoId = undefined;
    if (geometry?.type?.toUpperCase() === 'POINT') {
        mappedAvivGeoId = await getGeoHierarchyEnrichmentByCoordinatesByCache(_pool, location);
    }
    if (mappedAvivGeoId === undefined && avivGeoId !== undefined) {
        mappedAvivGeoId = await getGeoHierarchyEnrichmentByIdByCache(_pool, avivGeoId);
    }
    return mappedAvivGeoId;
}

async function mapGeoFromApi(_pool: Pool, location: Location) {
    const { avivGeoId, geometry } = location;
    let mappedAvivGeoId = undefined;
    let geo = undefined;
    if (geometry?.type?.toUpperCase() === 'POINT') {
        geo = await getGeoHierarchyEnrichmentByCoordinates(location);
    }
    if (geo === undefined && avivGeoId !== undefined) {
        geo = await getGeoHierarchyEnrichmentById(avivGeoId);
    }

    if (geo !== undefined && geo != null) {
        if (geo.length > 0) {
            mappedAvivGeoId = geo[geo.length - 1]?.id;
            await addGeoToCacheAsync(_pool, geo, mappedAvivGeoId, location);
        }
    }

    return mappedAvivGeoId
}

async function getGeoHierarchyEnrichmentById(avivGeoId: string): Promise<Feature[] | undefined> {
    const apisecrets = await getClassifiedApiSecret();
    const cliApi = createClient<paths>({
        baseUrl: apisecrets.GeoPlaceApiUrl,
    })

    const myMiddleware: Middleware = {
        async onRequest(req, options) {
            req.headers.set("accept", "application/json");
            req.headers.set("X-Api-Key", apisecrets.GeoPlaceApiKey);
            return req;
        }
    };
    cliApi.use(myMiddleware);
    const {
        data, // only present if 2XX response
        error, // only present if 4XX or 5XX response
    } = await cliApi.GET("/v1/places/{place_id}", {
        params: {
            path: { place_id: avivGeoId },
        }
    });
    if (error != null && error != undefined) {
        logger.error("error while calling api geo" + JSON.stringify(error));
        throw new Error("error while calling api geo" + JSON.stringify(error));
    }
    if (data != null) {
        return [...(data.item.parents ?? []), data.item]
    }
}

export const getGeoHierarchyEnrichmentByCoordinates = async (location: Location): Promise<Feature[] | undefined> => {
    const { avivGeoId, geometry } = location;
    if (geometry?.coordinates?.length == 2) {
        const apisecrets = await getClassifiedApiSecret();
        const cliApi = createClient<paths>({
            baseUrl: apisecrets.GeoPlaceApiUrl,
        })

        const myMiddleware: Middleware = {
            async onRequest(req, options) {
                req.headers.set("accept", "application/json");
                req.headers.set("X-Api-Key", apisecrets.GeoPlaceApiKey);
                return req;
            }
        };
        cliApi.use(myMiddleware);

        const [lon, lat] = geometry.coordinates;
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
        if (error != null && error != undefined) {
            logger.error("error while calling api geo" + JSON.stringify(error));
            throw new Error("error while calling api geo" + JSON.stringify(error));
        }

        if (data != null) {
            return data.items
        }
    }
    return null;
}


function single<T>(a: ReadonlyArray<T>, fallback?: T): T {
    if (a === undefined) return null;
    if (a.length === 1) return a[0];
    if (a.length === 0 && fallback !== void 0) return fallback;
    return null;
}

/*function getNamesForLevel(geo, level) {
    const result = [];
    geo.filter(item => item.level === level)
       .forEach(item => {
            Object.keys(item.names).forEach(lang => {
                if (!result[lang]) {
                    result[lang] = [];
                }
                item.names[lang].forEach(entry => {
                    result[lang].push(entry.name);
                });
            });
        });

    return result;
}*/

function getNamesForLevel(geo, level) {
    const result = {};
    geo.filter(item => item.level === level)
       .forEach(item => {
            Object.keys(item.names).forEach(lang => {
                if (!result[lang]) {
                    result[lang] = [];
                }
                item.names[lang].forEach(entry => {
                    result[lang].push(entry.name);
                });
            });
        });

    return result;
}

/*function getNamesForLevel(geo, level): string[] {
    const result = [];
    const namesByLanguage = {};

    // Rassemble les noms par langue dans un dictionnaire temporaire
    geo.filter(item => item.level === level)
       .forEach(item => {
            Object.keys(item.names).forEach(lang => {
                if (!namesByLanguage[lang]) {
                    namesByLanguage[lang] = [];
                }
                item.names[lang].forEach(entry => {
                    namesByLanguage[lang].push(entry.name);
                });
            });
        });

    // Transforme le dictionnaire en une liste d'objets
    Object.keys(namesByLanguage).forEach(lang => {
        result.push({ [lang]: namesByLanguage[lang] });
    });

    return result;
}*/

async function addGeoToCacheAsync(_pool: Pool, geo: Feature[], mappedAvivGeoId: string, location: Location) {
    const { avivGeoId, geometry } = location;
    const [lon, lat] = geometry?.coordinates ?? [];
    let geoLevel = single(geo.filter(x => x.id === mappedAvivGeoId))?.level;
    let countryId = single(geo?.filter(x => x.level === 200))?.id;
    let regionId = single(geo?.filter(x => x.level === 400))?.id;
    let microregionId = single(geo?.filter(x => x.level === 500))?.id;
    let provinceId = single(geo?.filter(x => x.level === 600))?.id;
    let municipalityID = single(geo?.filter(x => x.level === 800))?.id;
    let municipalityName  = getNamesForLevel(geo,800);
    let boroughID = single(geo?.filter(x => x.level === 900))?.id;
    let neighborhoodId = single(geo?.filter(x => x.level === 1000))?.id;
    let neighborhoodName = getNamesForLevel(geo, 1000);
    let blocId = single(geo?.filter(x => x.level === 1200))?.id;

    const geoValue = [
        mappedAvivGeoId,
        geoLevel,
        countryId,
        regionId,
        microregionId,
        provinceId,
        municipalityID,
        municipalityName,
        boroughID,
        neighborhoodId,
        neighborhoodName,
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
      municipalityName,
      boroughID,
      neighborhoodId,
      neighborhoodName,
      blocId,
      updateDate
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11,$12, NOW())
  ON CONFLICT (avivgeoId) DO UPDATE 
      SET    
      geoLevel = $2,
      countryId = $3,
      regionId= $4,
      microregionId= $5,
      provinceId= $6,
      municipalityID= $7,
      municipalityName= $8,
      boroughID= $9,
      neighborhoodId= $10,
      neighborhoodName= $11,
      blocId= $12,
      updateDate= NOW();`;

    await _pool.query(geoQuery, geoValue);

    if (lat !== undefined) {
        const geo_lat_lonValue = [
            lat,
            lon,
            mappedAvivGeoId
        ]

        const geo_lat_lon = `
      INSERT INTO geo_lat_lon (lat, lon, avivgeoId, updateDate) VALUES ($1, $2, $3, NOW())
      ON CONFLICT (lat,lon) DO UPDATE 
        SET    
        avivgeoId = $3,
        updateDate = NOW();`;
        await _pool.query(geo_lat_lon, geo_lat_lonValue);
    }
}


async function getGeoHierarchyEnrichmentByIdByCache(_pool: Pool, avivGeoId: string): Promise<string> {
    const geoQueryExists = `
    select avivgeoid from geo
    where avivgeoid = $1
    AND updateDate >= NOW() - INTERVAL '30 days'`;
    const geoValueExists = [
        avivGeoId
    ]

    let existsRecords = (await _pool.query(geoQueryExists, geoValueExists)).rows[0];
    return existsRecords?.avivgeoid;
}

async function getGeoHierarchyEnrichmentByCoordinatesByCache(_pool: Pool, location: Location): Promise<string> {
    const { avivGeoId, geometry } = location;
    const [lon, lat] = geometry?.coordinates ?? [];

    const geoQueryExists = `   
    select avivgeoid from geo_lat_lon
    where (lat = $1 and lon = $2)
    AND updateDate >= NOW() - INTERVAL '30 days'`;

    const geoValueExists = [
        lat,
        lon
    ]
    let existsRecords = (await _pool.query(geoQueryExists, geoValueExists)).rows[0];
    return existsRecords?.avivgeoid;
}

type Feature = components['schemas']['Feature'];