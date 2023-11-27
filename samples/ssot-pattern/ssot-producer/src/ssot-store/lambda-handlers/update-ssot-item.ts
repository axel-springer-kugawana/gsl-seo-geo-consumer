import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { updateSSoTEntity } from "ssot-store/adapters/ssot-store";
import { z } from "zod";

const updateCommandSchema = z.object({
    id: z.string().min(1),
    prop1: z.string().min(1),
    prop2: z.string().min(1),
    prop3: z.string().min(1),
    metadata : z.object({
        objectVersion: z.number(),
        partition: z.string(),
        dataModelVersion: z.string()
    })
});


export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const command =  updateCommandSchema.safeParse(event.body);

    if (command.success) {
        const item = await updateSSoTEntity({
            id: command.data.id,
            prop1: command.data.prop1,
            prop2: command.data.prop2,
            prop3: command.data.prop3,
            metadata: {
                dataModelVersion: command.data.metadata.dataModelVersion,
                objectVersion: command.data.metadata.objectVersion,
                partition: command.data.metadata.partition,
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
