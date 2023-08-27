import { publishClassifiedEvent } from "@shared/adapters/events-publisher";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { ClassifiedCreatedEvent } from "@shared/models/classifieds/1.0.0/models";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda";

export const lambdaHandler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  await publishClassifiedEvent<ClassifiedCreatedEvent>(
    {
      id: "cabf382d-47d1-6666-8b82-fff00bad4acd",
      type: "classified-created.v1",
      source: "abcd",
      eventcategory: 'IntegrationEvent',
      specversion: "1.0",
      subject: "classified/1234",
      data: {
          classifiedId: "1234", 
      }

  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Message published`
    }),
  };
}




export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);