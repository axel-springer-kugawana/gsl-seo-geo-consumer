import {
  BuildState,
  ClassifiedManagementStructure,
  DistributionSubTypeBuy,
  DistributionSubTypeRent,
  DistributionType,
  EstateSubType,
  ProjectType,
} from '@models'

export const mapProjectTypes = ({
  data,
  metadata,
  specifics,
}: {
  data: ClassifiedManagementStructure['data']
  metadata: ClassifiedManagementStructure['metadata']
  specifics?: ClassifiedManagementStructure['specifics']
}): string[] => {
  const { projectId, externalProjectId } = metadata
  const { rent: { isShortTimeRental = null } = {}, isForInvestment, isForSwap } = { ...data.management }
  const { buy: distributionSubTypeBuy, rent: distributionSubTypeRent } = { ...data.distributionSubType }
  const { flatSharePossible } = { ...specifics?.extraction?.features }
  const projectTypes: string[] = []

  if (
    projectId ||
    externalProjectId ||
    distributionSubTypeRent === DistributionSubTypeRent.NEW_BUILD_PROJECT || // Temporary while transitioning (need SEO to remove this criteria on project entity)
    (distributionSubTypeBuy &&
      [
        DistributionSubTypeBuy.NEW_BUILD_UNIT.valueOf(),
        DistributionSubTypeBuy.NEW_BUILD_INVESTMENT_PRODUCT.valueOf(),
        DistributionSubTypeBuy.NEW_BUILD_PROJECT.valueOf(), // Temporary while transitioning (need SEO to remove this criteria on project entity)
      ].includes(distributionSubTypeBuy))
  ) {
    projectTypes.push(ProjectType.NEW_BUILD)
  }

  if (isForInvestment || distributionSubTypeBuy === DistributionSubTypeBuy.NEW_BUILD_INVESTMENT_PRODUCT) {
    projectTypes.push(ProjectType.INVESTMENT)
  }

  if (
    isShortTimeRental ||
    distributionSubTypeRent === DistributionSubTypeRent.TEMPORARY ||
    distributionSubTypeRent === DistributionSubTypeRent.VACATION
  ) {
    projectTypes.push(ProjectType.SHORT_TIME_RENTAL)
  }

  if (
    data.conditions?.buildState === BuildState.PROJECTED ||
    distributionSubTypeBuy === DistributionSubTypeBuy.NEW_HOME
  ) {
    projectTypes.push(ProjectType.PROJECTED)
  }

  if (
    (data.estateSubType &&
      data.estateSubType[data.estateType.toLocaleLowerCase()] === EstateSubType.FLATSHARING_ROOM) ||
    flatSharePossible
  ) {
    projectTypes.push(ProjectType.FLATSHARING)
  }

  if (isForSwap) projectTypes.push(ProjectType.SWAP_APARTMENT)
  if (
    data.prices?.buy?.countrySpecific?.fr?.lifeAnnuity?.amount ||
    data.management?.countrySpecific?.be?.lifeAnnuity ||
    distributionSubTypeBuy === DistributionSubTypeBuy.LIFE_ANNUITY
  ) {
    projectTypes.push(ProjectType.LIFE_ANNUITY)
  }

  // Default if we don't have any project types
  if (projectTypes.length === 0) {
    if (data.distributionType === DistributionType.RENT) {
      projectTypes.push(ProjectType.STOCK)
    } else {
      projectTypes.push(ProjectType.RESALE)
    }
  }

  return projectTypes
}
