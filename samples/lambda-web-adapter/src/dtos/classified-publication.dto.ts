import { Static, Type } from "@sinclair/typebox";

enum PublicationStatus {
  Published = "published",
  Unpublished = "unpublished"
}

export const ClassifiedPublicationDtoSchema = Type.Object({
  status: Type.Enum(PublicationStatus)

});

export type ClassifiedPublicationDto = Static<typeof ClassifiedPublicationDtoSchema>


