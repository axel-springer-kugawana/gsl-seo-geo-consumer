import { Classified } from "@shared/models/classified/1.0.0/classified";
import { ProjectType, BuildState, Validation, DistributionType ,DistributionSubTypeRent, DistributionSubTypeBuy} from "cm-consumer/models/classifiedEnums";


export const mapProjectTypes = (
    classified: Classified
): string[] => {
    const { data, metadata } = classified;


    const { projectId, externalProjectId } = { ...metadata }

    const { rent: { isShortTimeRental = null } = {}, isForInvestment, isForSwap } = { ...data.management }
    const projectTypes: string[] = []
  
     const { buy: distributionSubTypeBuy, rent: distributionSubTypeRent } = { ...data.distributionSubType }
    // const projectTypes: string[] = []

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

    if (data.estateSubType && data.estateSubType[data.estateType.toLocaleLowerCase()] === 'FLATSHARING_ROOM') {
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
};
