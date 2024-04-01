export type PublicationStatus = "published" | "unpublished";

export type Classified = {
    classifiedId: string;
    publicationStatus: PublicationStatus;
    data: Record<string, any>;
    lastUpdateDate: string;
}