export const ClassifiedEventsSource = "platform.classified-management.dispatch";

export enum ClassifiedEventTypesV1 {
    ClassifiedCreated = 'classified-created.v1',
    ClassifiedCensored = 'classified-censored.v1'
}

export type ClassifiedEvent = { classifiedId: string, portal: number, offererEstateId: string, OffererMarketingKey: string };
export type ClassifiedIntegrationEvent = ClassifiedEvent & { parentClassifiedId: string };
export type ClassifiedCarriedStateEvent = ClassifiedEvent & { parent: ClassifiedEvent };
export type ClassifiedCreatedNotificationEventData = Pick<ClassifiedEvent, 'classifiedId'>;