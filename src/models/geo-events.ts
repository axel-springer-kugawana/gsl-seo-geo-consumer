import { GeoManagementStructure } from './geoManagementStructure'

export enum GeoEventType {
  CREATED = 'geo.created',
  UPDATED = 'geo.updated',
  DELETED = 'geo.deleted',
}

export interface GeoManagementEvent {
  type : GeoEventType
  data: GeoManagementStructure
  time: string // ISO 8601 timestamp, e.g. "2026-08-12T15:20:30.172Z"
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
