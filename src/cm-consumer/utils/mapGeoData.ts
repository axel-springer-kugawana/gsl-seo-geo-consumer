import { Logger } from '@aws-lambda-powertools/logger'
import {
  BrandCountry,
  EnrichmentType ,
  GeographicalType
}  from '@models';

import {
  ClassifiedManagementStructure,
  GeoDataEnrichmentMessage,
  GeoEnrichmentValueStructure,
 }   from "@models";


import { filterOutIrrelevantAvivGeoIds } from './filterAvivGeoIds'

import { mapCoordinates } from './mappingHelpers'

export type GeoDataResponse = {
  coordinates?: {
    lon: number
    lat: number
  }
  geoPrecision?: string | null
  placeIds?: string[]
  placeNames?: string[]
  debugData?: string[]
}

const getSsotGeoData = (enrichedData?: ClassifiedManagementStructure['enrichedData']) => {
  // Retrieve the SSOT geo enrichment data
  const geoEnrichments =
    enrichedData?.enrichments?.filter(({ enrichmentType }) => enrichmentType === EnrichmentType.GEO) ?? []
  const geoData = geoEnrichments
    .flatMap(({ enrichmentValues }) => enrichmentValues as GeoEnrichmentValueStructure[])
    .find(({ enrichment }) => enrichment === 'geo-enrichment')

  const { display, hierarchy } = geoData?.jsonValue ?? {}
  const { coordinates, isRandomised, inscribedPolygon } = display ?? {}
  const sortedPlaces = Object.values(hierarchy ?? {})
    .flat(2)
    .sort((a, b) => a.level - b.level)
  const placeIds = sortedPlaces.map((place) => place.id)
  const placeNames = [...new Set(sortedPlaces.flatMap((place) => (place.names?.default ? [place.names.default] : [])))]

  return { coordinates, isRandomised, inscribedPolygon, placeIds, placeNames }
}

export const mapGeoData = ({
  classifiedId,
  geoEnrichment,
  enrichedData,
  ssotGeoEnrichmentEnabledBrands,
  ssotGeoEnrichmentPlaceIds,
  brandCountry,
  logger,
}: {
  classifiedId: string
  geoEnrichment?: GeoDataEnrichmentMessage
  enrichedData?: ClassifiedManagementStructure['enrichedData']
  ssotGeoEnrichmentEnabledBrands: string[]
  ssotGeoEnrichmentPlaceIds: string[]
  brandCountry: BrandCountry | undefined
  logger: Logger
}): GeoDataResponse => {
  //if (ssotGeoEnrichmentPlaceIds.length === 0 ||ssotGeoEnrichmentEnabledBrands.includes(brandCountry ?? '')) {
    const { coordinates, isRandomised, inscribedPolygon, placeIds, placeNames } = getSsotGeoData(enrichedData)

    // If ssotGeoEnrichmentPlaceIds is empty, we always use the SSOT geo enrichment, else we only use it when one of the placeIds is in the list
    if (
      ssotGeoEnrichmentPlaceIds.length === 0 ||
      ssotGeoEnrichmentPlaceIds.some((placeId) => placeIds.includes(placeId))
    ) {
      const debugData = [
        `oldPlaceIds:[${geoEnrichment?.placeIds?.join(',')}]`,
        `oldCoordinates:[${JSON.stringify(geoEnrichment?.coordinates)}]`,
        `oldPrecision:[${geoEnrichment?.geoPrecision}]`,
      ]

      const filteredPlaceIds = filterOutIrrelevantAvivGeoIds({
        avivGeoIds: placeIds,
        brandCountry,
        showAddress: isRandomised === false,
      })
      if (filteredPlaceIds.length > 0) {
        return {
          coordinates: coordinates ? { lon: coordinates.lng, lat: coordinates.lat } : undefined,
          geoPrecision: isRandomised ? inscribedPolygon : GeographicalType.HONU,
          placeIds: filteredPlaceIds,
          ...(placeNames.length > 0 ? { placeNames } : {}),
          debugData,
        }
      }

      // Only raising warning if we have placeIds with the old enrichment
      if ((geoEnrichment?.placeIds?.length ?? 0) > 0) {
        logger.warn('[mapGeoData] SSOT geo enrichment has no placeIds, using fallback', {
          classifiedId,
          coordinates: JSON.stringify(coordinates),
          inscribedPolygon,
          isRandomised,
          placeIds: placeIds?.join(','),
          oldData: debugData,
        })
     // }
    }
  }

  return {
    coordinates: mapCoordinates(geoEnrichment?.coordinates),
    geoPrecision: geoEnrichment?.geoPrecision,
    placeIds: geoEnrichment?.placeIds,
    placeNames: geoEnrichment?.placeNames,
  }
}
