import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { createSSoTEntity } from "ssot-store/adapters/ssot-store";
import createCommand from "@shared/models/ssot-entity/create-command";
import { uuid } from 'uuidv4';

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {

    const command = createCommand.safeParse(JSON.parse(event.body!))
    
    if (command.success) {
        const item = await createSSoTEntity({
            id: uuid(),
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
