import { BrandCountry, Portal } from '@models'

export const getIsDE = (portals: string[] = []): boolean =>
  [Portal.IMMONET, Portal.IWT].some((portalDE) => portals.includes(portalDE))
export const getIsFR = (portals: string[] = []): boolean =>
  [Portal.SL, Portal.SLC, Portal.SLN, Portal.LI, Portal.LIN, Portal.BD, Portal.BUCOM, Portal.LR].some((portalDE) =>
    portals.includes(portalDE),
  )
const getIsAT = (portals: string[] = [], country?: string | null): boolean =>
  (country === 'AT' || country === 'AUT') && portals.includes(Portal.IWT)

export const getBrandCountry = (portals: string[] = [], country?: string | null): BrandCountry | undefined => {
  if (getIsAT(portals, country)) return BrandCountry.AT
  if (getIsDE(portals)) return BrandCountry.DE
  if (getIsFR(portals)) return BrandCountry.FR
  return undefined
}
