import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { deleteSSOTItem } from "ssot-store/adapters/ssot-store";
import { z } from "zod";

const deleteSchemaCommand = z.object({
    id: z.string().min(1),
});

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const command = deleteSchemaCommand.safeParse(JSON.parse(event.body!));
    if (command.success) {
        await deleteSSOTItem(command.data.id);
        return {
            statusCode: 200,
            body: ""
        }
    }

    return {
        statusCode: 400,
        body: JSON.stringify(command.error)
    }
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);
