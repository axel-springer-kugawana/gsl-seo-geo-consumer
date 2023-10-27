import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { getSSOTItem } from "@ssot-connector/adapters/ssot-sotw-store";
import { Context } from "aws-lambda";

type ItemsToProcess = { Items: string []}; 

export const lambdaHandler = async (event: ItemsToProcess, context: Context): Promise<void> => {
 
    await Promise.all(event.Items.map(async item => {
        const data = await getSSOTItem(item);
        console.log(JSON.stringify(data));
    }));
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);

