import convict from 'convict';


const configSchema = {
    ssotBucketName: {
        doc: 'Bucket name for the SSOT',
        format: String,
        default: "SSOT_BUCKET_NAME",
        env: 'SSOT_SOTW_BUCKET_NAME',
    },
    internalSSOTEventsQueueUrl: {
        doc: 'Internal SSOT Events QueueUrl',
        format: String,
        default: "INTERNAL_SSOT_EVENTS_QUEUE",
        env: 'INTERNAL_SSOT_EVENTS_QUEUE',
    },
}
export const config = convict(configSchema).validate({ allowed: 'strict' });

