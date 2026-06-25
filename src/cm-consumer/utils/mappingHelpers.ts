import { Classified} from "@shared/models/classified/1.0.0/classified";

import {ClassifiedManagementStructure } from '@models'
export const mapShowPrice = (
    classified: Classified
): boolean | undefined => {
    let showPrice = classified.data?.prices.showPrice;
    const buyPriceOnDemand = classified.data?.prices.buy?.price?.priceInformation == 'PRICE_ON_DEMAND';
    const baseRentPriceOnDemand = classified.data?.prices.rent?.baseRent?.priceInformation == 'PRICE_ON_DEMAND';
    const totalRentPriceOnDemand = classified.data?.prices.rent?.totalRent?.priceInformation == 'PRICE_ON_DEMAND';
    const leasePriceOnDemand = classified.data?.prices.rent?.lease?.priceInformation == 'PRICE_ON_DEMAND';
    const minimumBidOnDemand = classified.data?.prices.compulsoryAuction?.minimumBid?.priceInformation == 'PRICE_ON_DEMAND';

    if (buyPriceOnDemand || baseRentPriceOnDemand || totalRentPriceOnDemand || leasePriceOnDemand || minimumBidOnDemand) {
        return false;
    }
    
    if(showPrice === undefined)
        return true;
    
    return showPrice;
}


export const mapIsRangePrice_fifo = (
    classified: ClassifiedManagementStructure
): boolean | undefined => {
    const isRangePrice = classified.data?.prices.buy?.price?.priceInformation == 'BASE_ON_RANGE_PRICE';
    if (!isRangePrice) { return false; }
    return true;
}