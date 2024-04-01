import { Static, Type } from "@sinclair/typebox";

export const ClassifiedDtoSchema = Type.Object({
    id: Type.String(),
});
export const ClassifiedResponseDtoSchema = Type.Object({
    id: Type.String(),
});

export type ClassifiedDto = Static<typeof ClassifiedDtoSchema>;
export type ClassifiedResponseDto = Static<typeof ClassifiedResponseDtoSchema>;
