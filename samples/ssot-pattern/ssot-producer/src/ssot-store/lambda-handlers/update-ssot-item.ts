import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { updateSSoTEntity } from "ssot-store/adapters/ssot-store";
import updateCommand from "@shared/models/ssot-entity/update-command";

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const command =  updateCommand.safeParse(JSON.parse(event.body!));

    if (command.success) {
        const item = await updateSSoTEntity({
            ...command.data
        });

        return {
            statusCode: 200,
            body: JSON.stringify(item)
        }
    }
    return {
        statusCode: 400,
        body: JSON.stringify(command.error)
    }

}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);
