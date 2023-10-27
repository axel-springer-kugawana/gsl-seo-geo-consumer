export interface SSoTEntityCreatedEvent {
  data: SSoTEntityStateEventDataObject;
  type: SSoTEntityCreatedV1EventType;
  subject?: string;
  id: string;
  idempotencykey?: string;
  source: string;
  specversion: string;
  datacontenttype?: string;
  dataschema?: string;
  time?: string;
  dataBase64?: string;
}
 
export interface SSoTEntityStateEventDataObject {
  id?: string;
  version?: number;
  modelVersion?: string;
  updateDate?: number;
  property1?: string;
  property2?: string;
  property3?: string;
}
 
export type SSoTEntityCreatedV1EventType = "classified-created.v1";
 
export interface SSoTEntityUpdatedEvent {
  data: SSoTEntityStateEventDataObject;
  type: SSoTEntityUpdatedV1EventType;
  subject?: string;
  id: string;
  idempotencykey?: string;
  source: string;
  specversion: string;
  datacontenttype?: string;
  dataschema?: string;
  time?: string;
  dataBase64?: string;
}
 
export type SSoTEntityUpdatedV1EventType = "classified-updated.v1";
 
export interface SSoTEntityDeletedEvent {
  data: SSoTEntityDeletedEventDataObject;
  type: SSoTEntityDeletedV1EventType;
  id: string;
  idempotencykey?: string;
  source: string;
  specversion: string;
  datacontenttype?: string;
  dataschema?: string;
  subject?: string;
  time?: string;
  dataBase64?: string;
}
 
export interface SSoTEntityDeletedEventDataObject {
  id?: string;
}
 
export type SSoTEntityDeletedV1EventType = "classified-deleted.v1";
 
