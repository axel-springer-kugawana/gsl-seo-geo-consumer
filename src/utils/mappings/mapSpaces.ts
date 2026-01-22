import { ClassifiedManagementStructure, EstateType } from '@models'

export const mapSpaces = (
  spaces: ClassifiedManagementStructure['data']['spaces'],
  estateType: ClassifiedManagementStructure['data']['estateType'],
): number[] => {
  const {
    overallSpace,
    residential: { livingSpace = undefined } = {},
    commercial: { minDivisible = undefined } = {},
  } = spaces || {}

  if (livingSpace && livingSpace > 0) return [livingSpace]
  if (overallSpace) return [overallSpace]

  const possibleCommercialSpaces = [
    spaces?.commercial?.commercialSpace,
    spaces?.commercial?.managementSpace,
    spaces?.commercial?.officePartSpace,
    spaces?.commercial?.officeSpace,
    spaces?.commercial?.restaurantSpace,
    spaces?.commercial?.sellSpace,
    spaces?.commercial?.shopSpace,
    spaces?.commercial?.storageSpace,
  ]
  const commercialTotalSurfaces = possibleCommercialSpaces.reduce<number>((acc, val) => acc + (val ?? 0), 0)

  if (estateType === EstateType.OFFICE && minDivisible) {
    return commercialTotalSurfaces !== 0 ? [minDivisible, commercialTotalSurfaces] : [minDivisible]
  }
  return [commercialTotalSurfaces]
}
