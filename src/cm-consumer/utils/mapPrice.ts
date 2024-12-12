import { Classified } from "@shared/models/classified/1.0.0/classified";

import { Portal, DistributionType } from "cm-consumer/models/classifiedEnums";

// import { ClassifiedManagementStructure, DistributionType, Portal } from '@/models'

const getRentPrice = (
    rent: Classified['data']['prices']['rent'],
    isDE: boolean,
): { amount?: number } => {
  const hierarchyRentDEMapping = ['baseRent', 'totalRent', 'pricePerSqUnit']
  const hierarchyRentMapping = ['totalRent', 'baseRent', 'pricePerSqUnit']
  const selectedKey = isDE ? hierarchyRentDEMapping : hierarchyRentMapping

  return rent?.[`${selectedKey[0]}`] ?? rent?.[`${selectedKey[1]}`] ?? rent?.[`${selectedKey[2]}`]
}

const getBuyPrice = (buy: Classified['data']['prices']['buy']): { amount?: number } =>
  buy?.price ?? buy?.pricePerSqUnit

const getBuyAuctionPrice = (
    buyAuction: Classified['data']['prices']['buyAuction'],
    buy: Classified['data']['prices']['buy'],
): { amount?: number } => buyAuction?.minPrice ?? getBuyPrice(buy)

const getCompulsoryAuctionPrice = (
    compulsoryAuction: Classified['data']['prices']['compulsoryAuction'],
    buyAuction: Classified['data']['prices']['buyAuction'],
    buy: Classified['data']['prices']['buy']
): { amount?: number } => compulsoryAuction?.minimumBid ?? getBuyAuctionPrice(buyAuction, buy)

export const mapPrice = (
  data: Classified
): number | undefined => {
  const portals = data?.visibility?.requests;
  const distributionType = data.data.distributionType;
  const prices = data.data.prices;
  const { rent, buy, buyAuction, compulsoryAuction } = prices || {}
  const isDE = [Portal.IMMONET, Portal.IWT].some((portalDE) => portals?.includes(portalDE))

  const priceMapping = {
    [DistributionType.RENT]: getRentPrice(rent, isDE),
    [DistributionType.BUY]: getBuyPrice(buy),
    [DistributionType.BUY_AUCTION]: getBuyAuctionPrice(buyAuction, buy),
    [DistributionType.COMPULSORY_AUCTION]: getCompulsoryAuctionPrice(compulsoryAuction, buyAuction, buy),
    [DistributionType.BUY_RENT]: undefined,
  }

  return priceMapping[distributionType]?.amount
}

export const mapPricePerSqUnit = (
  distributionType: DistributionType,
  prices: Classified['data']['prices'],
): number | undefined => {
  if (distributionType === DistributionType.RENT) {
    return prices?.rent?.pricePerSqUnit?.amount
  }

  return prices?.buy?.pricePerSqUnit?.amount
}
