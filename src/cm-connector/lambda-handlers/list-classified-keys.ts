import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { publishKeys } from "@cm-connector/adapters/classified-keys-publisher";
import { listKeys } from "@cm-connector/adapters/classified-sotw-store";
import { chunkArray } from "@cm-connector/utils/chunk-array";
import { Context } from "aws-lambda";


type InvocationPayload = {
    nextContinuationToken: string,
    prefix: string,
    keyBatchingSize: number,
    operation: "upsert" | "delete"
}

export const lambdaHandler = async (payload: InvocationPayload, context: Context) => {

    let { keyBatchingSize, nextContinuationToken, prefix, operation } = payload;

    let keysCount = 0;

    for await (let { keys, nextContinuationToken: ct } of listKeys(prefix, nextContinuationToken)) {
        keysCount += keys.length;

        await Promise.all(chunkArray(keys, keyBatchingSize).map(async items => {
            await publishKeys({
                keys: items, 
                operation : operation || "upsert"
            });
        }));

        // stopping lambda when remaining time is less than 10 seconds
        if (context.getRemainingTimeInMillis() <= 10 * 1000) {
            const result = {
                iterator: { nextContinuationToken: ct },
                prefix,
                operation,
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
            keysCount,
            operation
        }
    }


}

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);
