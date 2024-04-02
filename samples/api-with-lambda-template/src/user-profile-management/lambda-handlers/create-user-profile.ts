import {
  enableLambdaPowertoolsLoggingAndMetrics,
  logger
} from 'user-profile-management/adapters/logging';
import { createUserProfile } from '@user-profile-management/adapters/user-profile-repository';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { problemDetailsResponse } from '@user-profile-management/dtos/problem-details';
import { dtoSchemas } from '@user-profile-management/dtos/schemas';

export const createUserProfileHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userProfileCommand = dtoSchemas.CreateUserProfileInput.safeParse(
    JSON.parse(event.body!)
  );

  if (userProfileCommand.success) {
    try {
      const userProfile = await createUserProfile({
        email: userProfileCommand.data.email,
        lastName: userProfileCommand.data.lastName,
        firstName: userProfileCommand.data.firstName
      });
      return {
        statusCode: 200,
        body: JSON.stringify(userProfile)
      };
    } catch (error) {
      logger.error('Error creating user profile', { error });

      return problemDetailsResponse({
        type: 'user-creation-error',
        title: 'User creation error',
        status: 500
      });
    }
  }

  return problemDetailsResponse({
    type: 'validation-error',
    title: 'Command not correct',
    status: 400,
    detail: userProfileCommand.error.issues.map((issue) => issue.message)
  });
};

export const handler = enableLambdaPowertoolsLoggingAndMetrics(
  createUserProfileHandler
);
