import { uniq } from 'lodash'
import { BrandCountry } from '@models';

// Usage: The allowedAvivGeoIds array contains the allowed aviv geo ids that we want to keep.
//  Everything below NBH3 is filtered out.
// https://demo-geo-preview.cosmic-bullfrog-preview.aws.aviv.eu/understand-new-types
const allowedAvivGeoIdsForSearch = [
  'NBH3',
  'NBH2',
  'STU1',
  'NBH1',
  'AD09',
  'POCO',
  'AD08',
  'AD07',
  'AD06',
  'AD05',
  'AD04',
  'AD03',
  'AD02',
]

// Get the list of aviv geo id type that can be used for randomizing the coordinates.
// Going from the most accurate to the least accurate.
// !!! the order of the aviv geo ids are important !!!
export const getAllowedAvivGeoIdsForRandomize = (brandCountry?: BrandCountry) => {
  switch (brandCountry) {
    case BrandCountry.FR: // For French brands, we are allowed to be more accurate with the randomization
      return ['STU3', 'NBH3', 'STU2', 'NBH2', 'STU1', 'NBH1', 'AD09', 'AD08']
    default:
      return ['NBH2', 'STU1', 'NBH1', 'AD09', 'AD08']
  }
}

const getAllowedAvivGeoIdsForSearch = (brandCountry?: BrandCountry, showAddress?: boolean) => {
  // Get aviv geo ids used for randomization to make sure the location used for it will be in the list of allowed aviv geo ids to be able to display the polygon on the map.
  const avivGeoIdsForRandomize = getAllowedAvivGeoIdsForRandomize(brandCountry)
  const streetGeoId = showAddress ? ['STRT'] : []
  const avivGeoIds = avivGeoIdsForRandomize.concat(allowedAvivGeoIdsForSearch).concat(streetGeoId)
  return uniq(avivGeoIds)
}

export const filterOutIrrelevantAvivGeoIds = ({
  avivGeoIds,
  showAddress,
  brandCountry,
}: {
  avivGeoIds: string[]
  showAddress?: boolean
  brandCountry?: BrandCountry
}) => {
  const allowedAvivGeoIds = getAllowedAvivGeoIdsForSearch(brandCountry, showAddress)
  return avivGeoIds.filter((avivGeoId) => allowedAvivGeoIds.some((allowedGeoId) => avivGeoId.startsWith(allowedGeoId)))
}
