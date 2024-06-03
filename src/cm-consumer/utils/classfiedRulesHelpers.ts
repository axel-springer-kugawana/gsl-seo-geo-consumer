import { MarketStatus } from './../models/classifiedEnums'
import { Classified, VisibilityStatus } from '@shared/models/classified/1.0.0/classified'

type DataEligibilityResult = {
    isEligible: boolean
    reasons: string[]
}

// For the search engine only authorized portals (MVP -> Immonet & Immowelt) as well as published classifieds must be processed
export const isAuthorized = (classifiedData: Classified): boolean => {
    if (!classifiedData.visibility?.validations || classifiedData.visibility?.validations.length === 0) {
        return true
    }
    return !(classifiedData.censorship?.globalStatus ?? false)
}


export const isGeoDataValid = (classifiedData: Classified): boolean => {
    const { geometry, avivGeoId } = classifiedData?.data?.location
    // If the classified has no usable location information, we don't want to index it
    if (!geometry && !avivGeoId) {
        return false
    }
    return true;
}

export const isMarketStatusEligibleForPublication = (classifiedData: Classified): boolean => {

    // Check the market status of the classified, we don't want to index already sold properties
    const marketStatus = classifiedData.data.management?.marketStatus
    if (marketStatus === MarketStatus.SOLD || marketStatus === MarketStatus.RENTED) {
        return false;
    }
    return true;
}