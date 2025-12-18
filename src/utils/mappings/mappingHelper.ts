import { Logger } from '@aws-lambda-powertools/logger'
import {
  ClassifiedManagementStructure,
  EstateSubType,
  EstateType,
  GeoDataEnrichmentCoordinates,
  UseFor,
} from '@models'

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// FIXME: IF YOU UPDATE A FUNCTION IN THIS FILE, EXTRACT IT TO A SEPARATE FILE
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

export const mapCoordinates = (coordinates: GeoDataEnrichmentCoordinates | undefined) => {
  if (coordinates) {
    return { lat: coordinates.latitude, lon: coordinates.longitude }
  }

  return undefined
}

export const mapUseFor = (data: ClassifiedManagementStructure['data']): UseFor | undefined => {
  const plotUseForMapping = {
    [EstateSubType.AGRICULTURE_FORESTRY]: UseFor.INDUSTRIAL,
    [EstateSubType.COMMERCIAL]: UseFor.COMMERCIAL,
    [EstateSubType.COMMERCIAL_PARC]: UseFor.COMMERCIAL,
    [EstateSubType.INDUSTRY]: UseFor.INDUSTRIAL,
    [EstateSubType.LAKESIDE_PROPERTY]: UseFor.MIXED,
    [EstateSubType.LEISURE_FACILITY]: UseFor.MIXED,
    [EstateSubType.LIVING]: UseFor.LIVING,
    [EstateSubType.MIXED]: UseFor.MIXED,
    [EstateSubType.SPECIAL_USE]: UseFor.MIXED,
  }

  let tempMappingUseFor: UseFor | undefined
  if (data.estateType === EstateType.PLOT) {
    tempMappingUseFor =
      data.estateSubType && data.estateSubType[data.estateType.toLocaleLowerCase()]
        ? plotUseForMapping[
            EstateSubType[data.estateSubType[data.estateType.toLocaleLowerCase()] as keyof typeof EstateSubType]
          ]
        : UseFor.MIXED
  } else if (data.estateType === EstateType.PARKING || data.estateType === EstateType.MISCELLANEOUS) {
    tempMappingUseFor = UseFor.MIXED
  }

  return (data.management?.useFor as UseFor) || tempMappingUseFor
}

export const mapEnergyCertificateClass = (
  energy: ClassifiedManagementStructure['data']['energy'] | undefined,
  classifiedId: string,
  logger: Logger,
): string | undefined => {
  const certificates = [
    energy?.countrySpecific?.de?.energyCertificates?.[0]?.efficiencyClass,
    energy?.countrySpecific?.fr?.energyCertificate?.efficiencyClass,
    energy?.countrySpecific?.at?.energyCertificates?.[0]?.overallEnergyEfficiencyFactorClass,
  ]

  const definedCertificates = certificates.filter((cert) => cert !== undefined)

  if (definedCertificates.length > 1) {
    logger.warn('[mapIndexClassifiedDocument] Classified energy certificate is in multiple country specific.', {
      classifiedId,
      energy: JSON.stringify(energy),
    })
  }

  return definedCertificates[0]
}

export const mapEstateSubType = (
  data: ClassifiedManagementStructure['data'],
  classifiedId: string,
  logger: Logger,
): string | undefined => {
  const estateSubTypes = Object.values(data.estateSubType ?? {})
  if (estateSubTypes.length > 0) {
    if (estateSubTypes.length > 1) {
      logger.warn('[mapIndexClassifiedDocument] Classified with mutliple estate sub type.', {
        classifiedId,
        estateSubType: data.estateSubType,
      })
    }
    return estateSubTypes[0]
  }

  return undefined
}
