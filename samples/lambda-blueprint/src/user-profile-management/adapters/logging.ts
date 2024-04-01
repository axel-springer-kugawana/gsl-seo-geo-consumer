import { injectLambdaContext, Logger } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import { Handler } from 'aws-lambda';

const logger = new Logger({});

const enableLambdaPowertoolsLoggingAndMetrics = (lambdaHandler: Handler) => {
  const enhancedhandler = middy(lambdaHandler).use(
    injectLambdaContext(logger, { clearState: true })
  );

  return enhancedhandler;
};

export { logger, enableLambdaPowertoolsLoggingAndMetrics };
