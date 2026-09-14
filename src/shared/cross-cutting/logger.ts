import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';


const logger = new Logger({ serviceName: 'geo-consumer' });
const metrics = new Metrics({ serviceName: 'geo-consumer' });


export {
    logger,
    metrics
}