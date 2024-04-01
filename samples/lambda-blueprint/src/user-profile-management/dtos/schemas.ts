import { z } from 'zod';

export const UserProfileData = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email()
  })
  .passthrough();
export const CreateUserProfileInput = UserProfileData;
export const UserProfile = UserProfileData.and(
  z.object({ id: z.string().uuid() }).passthrough()
);
export const ProblemDetails = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.array(z.unknown()).optional()
  })
  .passthrough();

export const dtoSchemas = {
  UserProfileData,
  CreateUserProfileInput,
  UserProfile,
  ProblemDetails
};

export type UserProfileDataDto = z.infer<typeof UserProfileData>;
export type CreateUserProfileInputDto = z.infer<typeof CreateUserProfileInput>;
export type UserProfileDto = z.infer<typeof UserProfile>;
export type ProblemDetailsDto = z.infer<typeof ProblemDetails>;
