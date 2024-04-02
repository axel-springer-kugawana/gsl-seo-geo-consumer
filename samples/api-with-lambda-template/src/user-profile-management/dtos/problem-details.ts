import { APIGatewayProxyResult } from 'aws-lambda';
import { ProblemDetailsDto } from './schemas';

export const problemDetailsResponse = (
  problemDetails: ProblemDetailsDto
): APIGatewayProxyResult => {
  return {
    statusCode: problemDetails.status,
    headers: { 'content-type': 'application/problem+json' },
    body: JSON.stringify(problemDetails)
  };
};
