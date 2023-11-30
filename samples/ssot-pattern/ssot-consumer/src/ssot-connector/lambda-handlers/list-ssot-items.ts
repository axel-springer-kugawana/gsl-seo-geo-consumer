import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { logger } from "@shared/cross-cutting/logger";
import { publishKeys } from "@ssot-connector/adapters/ssot-keys-publisher";
import { listKeys } from "@ssot-connector/adapters/ssot-sotw-store";
import { chunkArray } from "@ssot-connector/utils/chunk-array";
import { Context } from "aws-lambda";

type InvocationPayload = {
    nextContinuationToken: string,
    prefix: string,
    keyBatchingSize: number
}

export const lambdaHandler = async (payload: InvocationPayload, context: Context) => {

    let { keyBatchingSize, nextContinuationToken, prefix } = payload;

    let keysCount = 0;

    for await (let { keys, nextContinuationToken: ct } of listKeys(prefix, nextContinuationToken)) {
        keysCount += keys.length;

        await Promise.all(chunkArray(keys, keyBatchingSize).map(async items => {
            await publishKeys({
                Items: items
            })
        }));

        if (context.getRemainingTimeInMillis() <= 30 * 1000) {
            const result = {
                iterator: { nextContinuationToken: ct },
                prefix,
                keyBatchingSize,
                keysCount
            };

            logger.warn("condition verified, stopping lambda", {
                result
            });

            return result;
        }
    }

    return {
        iterator: {
            nextContinuationToken: "",
            prefix,
            keyBatchingSize,
            keysCount
        }
    }


}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);
