import { enableLambdaPowertoolsLoggingAndMetrics } from "@shared/cross-cutting/lambda-logging-middleware";
import { logger } from "@shared/cross-cutting/logger";
import { ClassifiedCreatedEvent } from "@shared/models/classifieds/1.0.0/models";
import { processSQSRecords } from "@shared/utils/sqs-queue-processing";
import { validateClassifiedCreatedEvent } from "@shared/validators/classifieds-events-validators";
import { SQSBatchResponse, SQSEvent } from "aws-lambda";


export const lambdaHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {

    const batchItemFailures = await processSQSRecords(event.Records, async (record) => {
        logger.info(`processing ${JSON.stringify(record.body)}`);
        
        const validationResult = validateClassifiedCreatedEvent(JSON.parse(record.body));
        if(!validationResult.valid) {
            logger.error(JSON.stringify(validationResult.errors));
            // Throw this error so that is can be reported on processSQSRecords
            throw new Error("not valid event model");
        }  else {
           
            // do something useful with the event
            const event : ClassifiedCreatedEvent = validationResult.event

            logger.info("received a valid classified created event", {
                eventPayload: event
            });
        }

    });

    return {
        batchItemFailures
    };
};

export const handler = enableLambdaPowertoolsLoggingAndMetrics(lambdaHandler);