import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';


const logger = new Logger({ serviceName: 'classified-consumer' });
const metrics = new Metrics({ serviceName: 'classified-consumer' });


export {
    logger,
    metrics
}