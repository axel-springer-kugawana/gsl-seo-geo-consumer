//import { MandatoryMessageData } from './baseMessage'

export type GeoDataEnrichmentMessage = {
  // Remarks: you need to update the method hasLocationDataChanged in correlation with what will be use by the get-geo-hierarchy lambda to populate this object
  coordinates?: GeoDataEnrichmentCoordinates
  placeIds?: string[]
  // Informational names derived from the geo hierarchy; intentionally excluded from hasLocationDataChanged because they should not trigger re-enrichment on their own.
  placeNames?: string[]
  geoPrecision?: string | null
  // If it exist, HONU avivGeoId source that was used as the randomized coordinates
  randomHonuAvivGeoId?: string | null
} //& MandatoryMessageData

export type GeoDataEnrichmentCoordinates = {
  longitude: number
  latitude: number
} | null

export type RankingDataEnrichmentSortOrderScoreExperiment = {
  experiment: string
  score: number
}

export type RankingDataEnrichmentMessage = {
  sortOrderScore?: number
  sortOrderScoreExperiment?: RankingDataEnrichmentSortOrderScoreExperiment[]
  leads?: number
  qualityScore?: number
  recencyScore?: number
} //& MandatoryMessageData

export type BookingDataEnrichmentMessage = {
  effectsSuggestion?: boolean
  effectsTopPosition?: boolean
} //& MandatoryMessageData

export type ClassifiedDetailReadinessEnrichmentMessage = {
  isReady?: boolean
} //& MandatoryMessageData
export type AggregatedUnitDataEnrichmentMessage = {
  estateTypes?: string[]
  estateSubTypes?: string[]
  priceMin?: number
  priceMax?: number
  pricePerSqUnitMin?: number
  pricePerSqUnitMax?: number
  spaceMin?: number
  spaceMax?: number
  plotSpaceMin?: number
  plotSpaceMax?: number
  numberOfRoomsMin?: number
  numberOfRoomsMax?: number
  numberOfBedroomsMin?: number
  numberOfBedroomsMax?: number
  features?: string[]
  useFor?: string[]
  energyTypes?: string[]
  furnished?: string[]
  energyCertificateClasses?: string[]
  locationsInBuilding?: string[]
}

export type ProjectEnrichmentMessage = {
  // Remarks: you need to update the method hasUnitProjectRelatedDataChanged in correlation with what will be use by the get-project-data lambda to populate this object
  buy?: AggregatedUnitDataEnrichmentMessage
  rent?: AggregatedUnitDataEnrichmentMessage
}   //& MandatoryMessageData
