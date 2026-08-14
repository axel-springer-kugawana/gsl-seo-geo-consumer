import { GeoManagementStructure } from './geoManagementStructure'

export enum GeoEventType {
  CREATED = 'geo.created',
  UPDATED = 'geo.updated',
  DELETED = 'geo.deleted',
}

export interface GeoManagementEvent {
  type : GeoEventType
  data: GeoManagementStructure
  time: number
  requestTime: number
  updateDate: string
  geoId: string
  requestDate: string
  updateAt: number
  blockDispatching: boolean
  state: string
  version: string
  geo: {
    metadata: unknown
    data: GeoManagementStructure
    media: unknown
    specifics: unknown
  }
}
