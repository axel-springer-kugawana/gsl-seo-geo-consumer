
import { publishClassifiedEvent } from "@events-producers/adapters/events-publisher";
import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { ClassifiedCensoredEvent } from "@shared/models/classifieds/1.0.0/models";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda";

export const lambdaHandler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  await publishClassifiedEvent<ClassifiedCensoredEvent>(
    {
      id: "cabf382d-47d1-6666-8b82-fff00bad4acd",
      type: "classified-censored.v1",
      source: "abcd",
      eventcategory: 'IntegrationEvent',
      // idempotency key can be computed based on the payload of the event
      idempotencykey: "cabf382d-47d1-6666-8b82-fff00bad4acd",
      specversion: "1.0",
      subject: "classified/1234",
      data: {
          classifiedId: "1234", 
          censorshipReason: "some reason"
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

