import { Classified } from "@shared/models/classified/1.0.0/classified";
import { Portal, DistributionType, BrandCountry } from "cm-consumer/models/classifiedEnums";

// import { ClassifiedManagementStructure, DistributionType, Portal } from '@/models'

const getRentPrice = (
    rent: Classified['data']['prices']['rent'],
    brandCountry: BrandCountry | undefined,
): { amount?: number } => {
  switch (brandCountry) {
    case BrandCountry.DE:
      return getRentPriceDE(rent)
    case BrandCountry.FR:
      return getRentPriceFR(rent)
    default:
      return { amount: undefined }
  }
}

const getRentPriceDE = (
  rent: NonNullable<Classified['data']['prices']>['rent'],
): { amount?: number } => rent?.baseRent ?? rent?.totalRent ?? rent?.pricePerSqUnit ?? { amount: undefined }

const getRentPriceFR = (
  rent: NonNullable<Classified['data']['prices']>['rent'],
): { amount?: number } => {
  const { totalRent, baseRent, operatingCosts, countrySpecific } = rent ?? {}
  const { fr: { overRegulatedRent = undefined } = {} } = countrySpecific ?? {}

  if (totalRent?.amount) {
    return {
      amount: totalRent.amount + (overRegulatedRent ?? 0),
    }
  }

  if (baseRent?.amount) {
    return {
      amount: baseRent.amount + (operatingCosts?.amount ?? 0) + (overRegulatedRent ?? 0),
    }
  }

  return { amount: undefined }
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
  const portals = data?.visibility?.requests?.map(p=>p.portal);
  const distributionType = data.data.distributionType;
  const prices = data.data.prices;
  const brandCountry = getBrandCountry(portals)
  const { rent, buy, buyAuction, compulsoryAuction } = prices || {}

  const priceMapping = {
    [DistributionType.RENT]: getRentPrice(rent, brandCountry),
    [DistributionType.BUY]: getBuyPrice(buy),
    [DistributionType.BUY_AUCTION]: getBuyAuctionPrice(buyAuction, buy),
    [DistributionType.COMPULSORY_AUCTION]: getCompulsoryAuctionPrice(compulsoryAuction, buyAuction, buy),
    [DistributionType.BUY_RENT]: undefined,
  }

  return priceMapping[distributionType]?.amount
}

export const getBrandCountry = (portals: string[] = []): BrandCountry | undefined => {
  if (getIsDE(portals)) return BrandCountry.DE
  if (getIsFR(portals)) return BrandCountry.FR
  return undefined
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

export const getIsDE = (portals: string[] = []): boolean =>
  [Portal.IMMONET, Portal.IWT].some((portalDE) => portals.includes(portalDE))
export const getIsFR = (portals: string[] = []): boolean =>
  [Portal.SL, Portal.SLC, Portal.SLN, Portal.LI, Portal.LIN, Portal.BD, Portal.BUCOM, Portal.LR].some((portalFR) =>
    portals.includes(portalFR),
  )


