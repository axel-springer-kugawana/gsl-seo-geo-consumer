
export type CommonDistributionSubType = 'NEW_BUILD_PROJECT' |
  'NEW_BUILD_UNIT' |
  'NEW_BUILD_INVESTMENT_PRODUCT';

export type DistributionSubTypeBuy = CommonDistributionSubType |
  'BUSINESS_SALE_GOODWILL' |
  'RESALE' |
  'LIFE_ANNUITY' |
  'NEW_HOME';

export type DistributionSubTypeRent = CommonDistributionSubType |
  'BUSINESS' |
  'BUSINESS_LEASEBACK' |
  'CLASSIC' |
  'TEMPORARY' |
  'VACATION';

export interface DistributionSubType {
  buy?: DistributionSubTypeBuy;
  rent?: DistributionSubTypeRent;
  buyRent?: CommonDistributionSubType;
}
