export interface ClassifiedCreateOrUpdateOrDeleteEvent {
    classifiedId: string;
    eventType: ClassifiedEventType;
    eventTime: number;
    modelVersion?: string;
    apiVersion: string;
    link?: string;
    visibility?: Visibility;
    censorship?: Censorship;
}


export enum ClassifiedEventType {
    CREATED = "CREATED",
    UPDATED = "UPDATED",
    DELETED = "DELETED",
}

interface Visibility {
    validations?: VisibilityProducer[];
}

interface VisibilityProducer {
    portal: Portals;
    visibilityStatus: VisibilityStatus;
    onTopProduct?: OnTopProductItem[];
}

enum Portals {
    SL = "SL",
    LI = "LI",
    LR = "LR",
    BD = "BD",
    BUCOM = "BUCOM",
    IWB = "IWB",
    IWT = "IWT",
    IMMONET = "IMMONET",
}

enum VisibilityStatus {
    PUBLISHED = "PUBLISHED",
    UNPUBLISHED = "UNPUBLISHED",
}

interface OnTopProductItem {
    onTopProductType: string;
    onTopProductStatus: OnTopProductStatus;
}

enum OnTopProductStatus {
    ACTIVATED = "ACTIVATED",
    UNACTIVATED = "UNACTIVATED",
}

interface Censorship {
    globalStatus?: boolean;
    unitary?: CensorshipUnitary[];
    additionalProperties?: Map<string, any>;
}

interface CensorshipUnitary {
    portal?: Portals;
    reservedStatus?: boolean;
    details?: string;
}

