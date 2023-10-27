import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { getSSOTItemById } from "ssot-store/adapters/ssot-store";

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {


    const id = event.pathParameters?.id;

    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify(
                {
                    type: "missing-id",
                    title: "Your request parameters didn't validate.",
                    "invalid-params": [{
                        "name": "id",
                        "reason": "must be a defined"
                    }]
                }
            )
        }
    }


    const item = await getSSOTItemById(id);

    if (!item) {
        return {
            statusCode: 404,
            body: JSON.stringify(
                {
                    type: "not-found",
                    title: "Element not found",
                }
            )
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify(item)
    }

};




export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);
