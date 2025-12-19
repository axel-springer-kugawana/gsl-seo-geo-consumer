import { Portal }  from '@models'

import { getBrandCountry, getIsDE, getIsFR } from './brandHelper'

describe('getIsDE', () => {
  it('should return true if portals includes IWT or IMMONET', () => {
    expect(getIsDE([Portal.IWT, Portal.IMMONET])).toBe(true)
  })

  it('should return false if portals does not include IMMONET or IWT', () => {
    expect(getIsDE([Portal.SL])).toBe(false)
  })

  it('should return false if portals is empty', () => {
    expect(getIsDE([])).toBe(false)
  })
})

describe('getIsFR', () => {
  it('should return true if portals includes SL', () => {
    expect(getIsFR([Portal.SL])).toBe(true)
  })

  it('should return false if portals does not include any FR portals', () => {
    expect(getIsFR([Portal.IMMONET])).toBe(false)
  })

  it('should return false if portals is empty', () => {
    expect(getIsFR([])).toBe(false)
  })
})

describe('getBrandCountry', () => {
  it('should return DE', () => {
    expect(getBrandCountry([Portal.IWT])).toBe('DE')
  })

  it('should return FR', () => {
    expect(getBrandCountry([Portal.SL])).toBe('FR')
  })

  it('should return AT when country is AT', () => {
    expect(getBrandCountry([Portal.IWT], 'AT')).toBe('AT')
  })

  it('should return AT when country is AUT', () => {
    expect(getBrandCountry([Portal.IWT], 'AUT')).toBe('AT')
  })

  it('should return DE if IWT has not at country', () => {
    expect(getBrandCountry([Portal.IWT], null)).toBe('DE')
  })

  it('should return undefined if unsupported portal', () => {
    expect(getBrandCountry([Portal.IWB])).toBeUndefined()
  })

  it('should return undefined if portals is empty', () => {
    expect(getBrandCountry([])).toBeUndefined()
  })
})
