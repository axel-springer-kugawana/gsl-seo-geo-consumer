import { Static, Type } from "@sinclair/typebox";

// TODO: use problem details format
export const ErrorSchema = Type.Object({
    error: Type.String(),

});

export type ErrorDto = Static<typeof ErrorSchema>;
