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
 
interface ClassifiedCreatedEventDataObject {
  classifiedId?: string;
}
 
type ClassifiedCreatedV1EventType = "classified-created.v1";
 
type EventCategory = "IntegrationEvent" | "DomainEvent";
 
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
 
interface ClassifiedCensoredEventDataObject {
  classifiedId: string;
  censorshipReason?: string;
}
 
type ClassifiedCensoredV1EventType = "classified-censored.v1";
 
