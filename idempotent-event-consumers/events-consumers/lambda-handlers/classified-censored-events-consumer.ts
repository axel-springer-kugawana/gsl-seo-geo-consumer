import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { IdempotencyConfig, makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { logger } from "@shared/cross-cutting/logger";
import { ClassifiedCensoredEvent } from "@shared/models/classifieds/1.0.0/models";
import { validateClassifiedCensoredEvent } from "@shared/validators/classifieds-events-validators";
import { Context, SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { idempotecyPersistenceStore } from "@events-consumers/adapters/idempotency-persistence-store";
import { BatchProcessor, EventType, processPartialResponse } from '@aws-lambda-powertools/batch';
import { handleCensoredClassified } from "@events-consumers/use-cases/classified-censored-event-handler";
import { Unit } from "@shared/models/unit";

const idempotencyConfig = new IdempotencyConfig({
    eventKeyJmesPath: `idempotencykey`,
    throwOnNoIdempotencyKey: true
});

const idempotentCensoredClassifiedProcessor = makeIdempotent(
    async (body: any): Promise<Unit> => {
        logger.info(`processing ${JSON.stringify(body)}`);
        const validationResult = validateClassifiedCensoredEvent(body);
        if (!validationResult.valid) {
            logger.error(JSON.stringify(validationResult.errors));
            // Throw this error so that is can be reported by processSQSRecords
            throw new Error("not valid event model");
        } else {
            const event: ClassifiedCensoredEvent = validationResult.event;

            logger.info("received a valid classified censored event", {
                eventPayload: event
            });

            await handleCensoredClassified(event.data);

            return Unit;
        }

    },
    {
        persistenceStore: idempotecyPersistenceStore,
        config: idempotencyConfig,
    }
);

const sqsBatchProcessor = new BatchProcessor(EventType.SQS);

export const lambdaHandler = async (event: SQSEvent, context: Context): Promise<SQSBatchResponse> => {
    idempotencyConfig.registerLambdaContext(context);
    return processPartialResponse(event, async (record: SQSRecord) => {
        const event  = JSON.parse(record.body);
        return await idempotentCensoredClassifiedProcessor(event);
    }, sqsBatchProcessor, {
        context,
    });
};




export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);