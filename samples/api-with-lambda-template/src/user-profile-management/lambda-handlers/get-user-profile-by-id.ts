import {
  enableLambdaPowertoolsLoggingAndMetrics,
  logger
} from 'user-profile-management/adapters/logging';
import { getUserProfileById } from '@user-profile-management/adapters/user-profile-repository';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { problemDetailsResponse } from '@user-profile-management/dtos/problem-details';

export const getUserProfileByIdHandler = async (
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
    const userProfile = await getUserProfileById(id);

    if (!userProfile) {
      return problemDetailsResponse({
        type: 'not-found',
        title: `User profile ${id} not found`,
        status: 404
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(userProfile)
    };
  } catch (error) {
    logger.error('Error getting user profile', { error, id });

    return problemDetailsResponse({
      type: 'internal-server-error',
      title: 'Internal server error',
      status: 500
    });
  }
};

export const handler = enableLambdaPowertoolsLoggingAndMetrics(
  getUserProfileByIdHandler
);
