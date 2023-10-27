import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { Context, SQSEvent } from "aws-lambda";

export const lambdaHandler = async (event: SQSEvent, context: Context): Promise<void> => {
    
    for (let index = 0; index < event.Records.length; index++) {
        console.log(JSON.stringify(event.Records[index]));
    }
    
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);
