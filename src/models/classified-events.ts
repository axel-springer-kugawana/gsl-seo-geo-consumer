// import { MandatoryMessageData } from './baseMessage'
import { ClassifiedManagementStructure } from './classifiedManagementStructure'

export enum VisibilityStatus {
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED',
}

export type VisibilityValidations = NonNullable<ClassifiedManagementFatSsotEvent['data']['visibility']>['validations']

export enum LightEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

export enum FatEventType {
  CREATED = 'classified.created',
  UPDATED = 'classified.updated',
  DELETED = 'classified.deleted',
}

export interface ClassifiedManagementFatSsotEvent {
  type: FatEventType
  data: ClassifiedManagementStructure
  time: number
}

// export interface ClassifiedDeleted extends MandatoryMessageData {
export interface ClassifiedDeleted  {
  classifiedId: string
  visibility?: ClassifiedManagementFatSsotEvent['data']['visibility']
  marketStatus?: string
}

export type ClassifiedManagementBucketObject = {
  requestTime: number
  updateDate: string
  classifiedId: string
  requestDate: string
  updateAt: number
  blockDispatching: boolean
  state: string
  version: string
  classified: {
    metadata: unknown
    data: unknown
    visibility?: ClassifiedManagementFatSsotEvent['data']['visibility']
    media: unknown
    specifics: unknown
  }
}
