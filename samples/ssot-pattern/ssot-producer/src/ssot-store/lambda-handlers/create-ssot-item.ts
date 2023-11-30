import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { createSSoTEntity } from "ssot-store/adapters/ssot-store";
import createCommand from "@shared/models/ssot-entity/create-command";
import { v4 as uuidv4 } from 'uuid';

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {

    const command = createCommand.safeParse(JSON.parse(event.body!))
    
    if (command.success) {
        const item = await createSSoTEntity({
            id: uuidv4(),
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
