import convict from 'convict';


const configSchema = {
    ssotBucketName: {
        doc: 'Bucket name for the SSOT',
        format: String,
        default: "SSOT_BUCKET_NAME",
        env: 'SSOT_SOTW_BUCKET_NAME',
    },
    keysQueueUrl: {
        doc: 'Keys to Procress Queue',
        format: String,
        default: "SSOT_KEYS_QUEUE",
        env: 'SSOT_KEYS_QUEUE',
    },
    internalSSOTEventsQueueUrl: {
        doc: 'Internal SSOT Events QueueUrl',
        format: String,
        default: "INTERNAL_SSOT_EVENTS_QUEUE",
        env: 'INTERNAL_SSOT_EVENTS_QUEUE',
    }
}
export const config = convict(configSchema).validate({ allowed: 'strict' });

