import {
  enableLambdaPowertoolsLoggingAndMetrics,
  logger
} from 'user-profile-management/adapters/logging';
import { deleteUserProfile } from '@user-profile-management/adapters/user-profile-repository';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { problemDetailsResponse } from '@user-profile-management/dtos/problem-details';

export const deleteUserProfileHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.userId;

  if (!id) {
    return problemDetailsResponse({
      type: 'missing-id',
      title: 'Missing Mandatory parameter "userId"',
      status: 400
    });
  }

  try {
    await deleteUserProfile(id);

    return {
      statusCode: 204,
      body: ''
    };
  } catch (error) {
    logger.error('Error when deleting user profile', { error });

    return problemDetailsResponse({
      type: 'internal-server-error',
      title: 'Internal server error',
      status: 500
    });
  }
};

export const handler = enableLambdaPowertoolsLoggingAndMetrics(
  deleteUserProfileHandler
);
