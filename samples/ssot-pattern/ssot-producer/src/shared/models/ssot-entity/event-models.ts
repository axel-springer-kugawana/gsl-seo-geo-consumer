export type SSoTEntityEvents = SSoTEntityUpdatedEvent | SSoTEntityCreatedEvent | SSoTEntityDeletedEvent;
 
export interface SSoTEntityUpdatedEvent {
  id: string;
  source: string;
  idempotencykey?: string;
  data: SSoTEntityStateEventData;
  type: 'ssotentity-updated.v1';
  specversion: '1.0';
}
 
export interface SSoTEntityStateEventData {
  id: string;
  estateType: string;
  distributionType: string;
  metadata: SsotEntityMetadata;
}
 
export interface SsotEntityMetadata {
  objectVersion: number;
  dataModelVersion: string;
  partition: string;
}
 
export interface SSoTEntityCreatedEvent {
  id: string;
  source: string;
  idempotencykey?: string;
  data: SSoTEntityStateEventData;
  type: 'ssotentity-created.v1';
  specversion: '1.0';
}
 
export interface SSoTEntityDeletedEvent {
  id: string;
  source: string;
  idempotencykey?: string;
  data: SSoTEntityDeletedEventData;
  type: 'ssotentity-deleted.v1';
  specversion: '1.0';
}
 
export interface SSoTEntityDeletedEventData {
  id: string;
  metadata: SsotEntityMetadata;
}
 
