import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { logger } from "@shared/cross-cutting/logger";
import { Context, SQSEvent } from "aws-lambda";

export const lambdaHandler = async (event: SQSEvent, context: Context): Promise<void> => {
    
    for (let index = 0; index < event.Records.length; index++) {
        logger.info("Processing events...",JSON.stringify(event.Records[index]));
    }
    
}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);
