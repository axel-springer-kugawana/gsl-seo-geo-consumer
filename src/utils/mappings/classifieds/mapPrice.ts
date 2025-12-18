import {
  BrandCountry,
  ClassifiedManagementStructure ,
 DistributionType,
 PriceAmountStructure,
 PriceInformation,
} from '@models';

// eslint-disable-next-line no-confusing-arrow
const getPrice = (price: PriceAmountStructure): { amount?: number } | undefined =>
  price?.priceInformation !== PriceInformation.PRICE_ON_DEMAND ? price : undefined

const getRentPriceDE = (
  rent: NonNullable<ClassifiedManagementStructure['data']['prices']>['rent'],
): { amount?: number } =>
  getPrice(rent?.baseRent) ?? getPrice(rent?.totalRent) ?? getPrice(rent?.pricePerSqUnit) ?? { amount: undefined }

const getRentPriceAT = (
  rent: NonNullable<ClassifiedManagementStructure['data']['prices']>['rent'],
): { amount?: number } => {
  const { totalRent, baseRent, baseRentPerYear, pricePerSqUnit, pricePerSqUnitPerYear, countrySpecific } = rent ?? {}
  const { at: { rentNet = undefined, overallLoadGross = undefined } = {} } = countrySpecific ?? {}
  return (
    getPrice(totalRent) ??
    getPrice(overallLoadGross) ??
    getPrice(baseRent) ??
    getPrice(rentNet) ??
    getPrice(baseRentPerYear) ??
    getPrice(pricePerSqUnit) ??
    getPrice(pricePerSqUnitPerYear) ?? { amount: undefined }
  )
}

const getRentPriceFR = (
  rent: NonNullable<ClassifiedManagementStructure['data']['prices']>['rent'],
): { amount?: number } => {
  const { totalRent, baseRent, operatingCosts, countrySpecific } = rent ?? {}
  const { fr: { overRegulatedRent = undefined } = {} } = countrySpecific ?? {}

  const actualTotalRent = getPrice(totalRent)
  if (actualTotalRent?.amount) {
    return {
      amount: actualTotalRent.amount + (overRegulatedRent ?? 0),
    }
  }

  const actualBaseRent = getPrice(baseRent)
  if (actualBaseRent?.amount) {
    return {
      amount: actualBaseRent.amount + (operatingCosts?.amount ?? 0) + (overRegulatedRent ?? 0),
    }
  }

  return { amount: undefined }
}

const getRentPrice = (
  rent: NonNullable<ClassifiedManagementStructure['data']['prices']>['rent'],
  brandCountry: BrandCountry | undefined,
): { amount?: number } => {
  switch (brandCountry) {
    case BrandCountry.AT:
      return getRentPriceAT(rent)
    case BrandCountry.DE:
      return getRentPriceDE(rent)
    case BrandCountry.FR:
      return getRentPriceFR(rent)
    default:
      return { amount: undefined }
  }
}

const getBuyPrice = (buy: NonNullable<ClassifiedManagementStructure['data']['prices']>['buy']): { amount?: number } =>
  getPrice(buy?.price) ?? getPrice(buy?.pricePerSqUnit) ?? { amount: undefined }

const getBuyAuctionPrice = (
  buyAuction: NonNullable<ClassifiedManagementStructure['data']['prices']>['buyAuction'],
  buy: NonNullable<ClassifiedManagementStructure['data']['prices']>['buy'],
): { amount?: number } => buyAuction?.minPrice ?? getBuyPrice(buy)

const getCompulsoryAuctionPrice = (
  compulsoryAuction: NonNullable<ClassifiedManagementStructure['data']['prices']>['compulsoryAuction'],
  buyAuction: NonNullable<ClassifiedManagementStructure['data']['prices']>['buyAuction'],
  buy: NonNullable<ClassifiedManagementStructure['data']['prices']>['buy'],
): { amount?: number } =>
  compulsoryAuction?.marketValue ?? compulsoryAuction?.minimumBid ?? getBuyAuctionPrice(buyAuction, buy)

export const mapPrice = ({
  distributionType,
  prices,
  brandCountry,
}: {
  distributionType: ClassifiedManagementStructure['data']['distributionType']
  prices: ClassifiedManagementStructure['data']['prices']
  brandCountry: BrandCountry | undefined
}): number | undefined => {
  if (!prices) {
    return undefined
  }

  const { rent, buy, buyAuction, compulsoryAuction, showPrice } = prices
  if (showPrice === false) {
    return undefined
  }

  switch (distributionType) {
    case DistributionType.RENT:
      // eslint-disable-next-line no-case-declarations
      return getRentPrice(rent, brandCountry)?.amount
    case DistributionType.BUY:
      return getBuyPrice(buy)?.amount
    case DistributionType.BUY_AUCTION:
      return getBuyAuctionPrice(buyAuction, buy)?.amount
    case DistributionType.COMPULSORY_AUCTION:
      return getCompulsoryAuctionPrice(compulsoryAuction, buyAuction, buy)?.amount
    default:
      return undefined
  }
}

export const mapPricePerSqUnit = (
  distributionType: ClassifiedManagementStructure['data']['distributionType'],
  prices: ClassifiedManagementStructure['data']['prices'],
): number | undefined => {
  if (!prices) {
    return undefined
  }

  const { rent, buy, showPrice } = prices
  if (showPrice === false) {
    return undefined
  }

  if (distributionType === DistributionType.RENT) {
    return getPrice(rent?.pricePerSqUnit)?.amount
  }

  return getPrice(buy?.pricePerSqUnit)?.amount
}

export const mapWarmRent = (
  prices: ClassifiedManagementStructure['data']['prices'],
  distributionType: ClassifiedManagementStructure['data']['distributionType'],
  brandCountry: BrandCountry | undefined,
): number | undefined => {
  if (brandCountry === BrandCountry.DE && distributionType === DistributionType.RENT) {
    if (prices?.rent?.totalRent?.amount) {
      return getPrice(prices.rent.totalRent)?.amount
    }
    if (prices?.rent?.baseRent?.amount) {
      return getPrice(prices.rent.baseRent)?.amount
    }
  }
  return undefined
}

export const mapColdRent = (
  prices: ClassifiedManagementStructure['data']['prices'],
  distributionType: ClassifiedManagementStructure['data']['distributionType'],
  brandCountry: BrandCountry | undefined,
): number | undefined => {
  if (brandCountry === BrandCountry.DE && distributionType === DistributionType.RENT) {
    if (prices?.rent?.baseRent?.amount) {
      return getPrice(prices.rent.baseRent)?.amount
    }
    if (prices?.rent?.totalRent?.amount) {
      return getPrice(prices.rent.totalRent)?.amount
    }
  }
  return undefined
}
