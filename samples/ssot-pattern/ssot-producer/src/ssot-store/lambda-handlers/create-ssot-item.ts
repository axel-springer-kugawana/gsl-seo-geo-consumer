import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { createSSoTEntity } from "ssot-store/adapters/ssot-store";
import { uuid } from 'uuidv4';
import { z } from "zod";

const createCommandSchema = z.object({
    prop1: z.string().min(1),
    prop2: z.string().min(1),
    prop3: z.string().min(1)
});

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {

    const command = createCommandSchema.safeParse(JSON.parse(event.body!))
    
    if (command.success) {
        const item = await createSSoTEntity({
            id: uuid(),
            prop1: command.data.prop1,
            prop2: command.data.prop2,
            prop3: command.data.prop3,
            metadata : {
                partition: "WL",
                dataModelVersion: "1.0",
                objectVersion: 1
            }
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
