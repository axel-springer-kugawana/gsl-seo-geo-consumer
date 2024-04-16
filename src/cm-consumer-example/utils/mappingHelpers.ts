import { Classified } from "@shared/models/classified/1.0.0/classified";
import { DistributionType, Portal } from '../models/classifiedEnums';
//https://avivgroup.atlassian.net/wiki/spaces/ATSS/pages/300812851/Search+index+model
export const mapPrice = (
    data: Classified
): number | null => {

    const portals = data.visibility.requests;
    const distributionType = data.data.distributionType;
    const prices = data.data.prices;

    const { rent, buy, buyAuction, compulsoryAuction } = prices || {}
    const isDE = [Portal.IMMONET, Portal.IWT].some((portal) => portals?.map((p) => p.portal).includes(portal))
    const priceMapping = {
        [DistributionType.RENT]: getRentPrice(rent, isDE),
        [DistributionType.BUY]: buy?.price ?? buy?.pricePerSqUnit,
        [DistributionType.BUY_AUCTION]: getBuyAuctionPrice(buyAuction, buy),
        [DistributionType.COMPULSORY_AUCTION]: getCompulsoryAuctionPrice(compulsoryAuction, buyAuction, buy),
    }
    return priceMapping[distributionType]?.amount
}

const getRentPrice = (
    rent: Classified['data']['prices']['rent'],
    isDE: boolean,
): { amount?: number } => {
    const hierarchyRentDEMapping = ['baseRent', 'totalRent', 'pricePerSqUnit']
    const hierarchyRentMapping = ['totalRent', 'baseRent', 'pricePerSqUnit']
    const selectedKey = isDE ? hierarchyRentDEMapping : hierarchyRentMapping
    return rent?.[`${selectedKey[0]}`] ?? rent?.[`${selectedKey[1]}`] ?? rent?.[`${selectedKey[2]}`]
}
const getBuyAuctionPrice = (
    buyAuction: Classified['data']['prices']['buyAuction'],
    buy: Classified['data']['prices']['buy'],
): { amount?: number } => buyAuction?.minPrice ?? buy?.price ?? buy?.pricePerSqUnit
const getCompulsoryAuctionPrice = (
    compulsoryAuction: Classified['data']['prices']['compulsoryAuction'],
    buyAuction: Classified['data']['prices']['buyAuction'],
    buy: Classified['data']['prices']['buy'],
): { amount?: number } => compulsoryAuction?.minimumBid ?? getBuyAuctionPrice(buyAuction, buy)



