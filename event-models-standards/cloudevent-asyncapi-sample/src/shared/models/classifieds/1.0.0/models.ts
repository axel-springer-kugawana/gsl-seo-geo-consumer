export interface ClassifiedCreatedEvent {
  data: ClassifiedCreatedEventDataObject;
  type: ClassifiedCreatedV1EventType;
  subject?: string;
  id: string;
  eventcategory?: EventCategory;
  idempotencykey?: string;
  correlationid?: string;
  source: string;
  specversion: string;
  datacontenttype?: string;
  dataschema?: string;
  time?: string;
  dataBase64?: string;
}
 
export interface ClassifiedCreatedEventDataObject {
  classifiedId?: string;
}
 
export type ClassifiedCreatedV1EventType = "classified-created.v1";
 
export type EventCategory = "IntegrationEvent" | "DomainEvent";
 
export interface ClassifiedCensoredEvent {
  data: ClassifiedCensoredEventDataObject;
  type: ClassifiedCensoredV1EventType;
  id: string;
  eventcategory?: EventCategory;
  idempotencykey?: string;
  correlationid?: string;
  source: string;
  specversion: string;
  datacontenttype?: string;
  dataschema?: string;
  subject?: string;
  time?: string;
  dataBase64?: string;
}
 
export interface ClassifiedCensoredEventDataObject {
  classifiedId: string;
  censorshipReason?: string;
}
 
export type ClassifiedCensoredV1EventType = "classified-censored.v1";
 
