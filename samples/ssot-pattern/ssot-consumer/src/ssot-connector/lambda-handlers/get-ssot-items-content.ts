import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { logger } from "@shared/cross-cutting/logger";
import { publishDataAsReplayedEvent } from "@ssot-connector/adapters/ssot-replay-event-publisher";
import { getSSOTItem } from "@ssot-connector/adapters/ssot-sotw-store";
import { Context } from "aws-lambda";


type ItemsToProcess = { Items: string[] };



export const lambdaHandler = async (event: ItemsToProcess, context: Context): Promise<void> => {


    logger.info("Processing ssot keys...", {
        numberOfItemsToProcess: event.Items.length
    });

    await Promise.all(event.Items.map(async key => {
        const data = await getSSOTItem(key);
        await publishDataAsReplayedEvent(data)
    }));
}


export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);

