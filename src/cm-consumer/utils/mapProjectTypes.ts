import { Classified } from "@shared/models/classified/1.0.0/classified";
import { ProjectType, BuildState, Validation, DistributionType } from "cm-consumer/models/classifiedEnums";


export const mapProjectTypes = (
    classified: Classified
): string[] => {
    const { data, metadata } = classified;


    const { projectId, externalProjectId } = { ...metadata }

    const { rent: { isShortTimeRental = null } = {}, isForInvestment, isForSwap } = { ...data.management }
    const projectTypes: string[] = []
  
    if (projectId || externalProjectId) projectTypes.push(ProjectType.NEW_BUILD)
    if (isForInvestment) projectTypes.push(ProjectType.INVESTMENT)
    if (isShortTimeRental) projectTypes.push(ProjectType.SHORT_TIME_RENTAL)
    if (data.conditions?.buildState === BuildState.PROJECTED) projectTypes.push(ProjectType.PROJECTED)
    if (data.estateSubType && data.estateSubType[data.estateType.toLocaleLowerCase()] === 'FLATSHARING_ROOM') {
      projectTypes.push(ProjectType.FLATSHARING)
    }
    if (isForSwap) projectTypes.push(ProjectType.SWAP_APARTMENT)
    if (projectTypes.length === 0) {
      if (data.distributionType === DistributionType.RENT) {
        projectTypes.push(ProjectType.STOCK)
      } else {
        projectTypes.push(ProjectType.RESALE)
      }
    }
    if (data.prices?.buy?.countrySpecific?.fr?.lifeAnnuity?.amount || data.management?.countrySpecific?.be?.lifeAnnuity) {
      projectTypes.push(ProjectType.LIFE_ANNUITY)
    }
    return projectTypes
};
