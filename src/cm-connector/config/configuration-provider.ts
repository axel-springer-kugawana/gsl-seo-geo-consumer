import convict from 'convict';

const configSchema = {
    ssotBucketName: {
        doc: 'Bucket name for CM',
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
    connectorEventsQueue: {
        doc: 'Internal connector Events QueueUrl',
        format: String,
        default: "CONNECTOR_EVENTS_QUEUE",
        env: 'CONNECTOR_EVENTS_QUEUE',
    },
    cmApiUrl: {
        doc: 'Classifieds API Url',
        format: String,
        default: "CM_API_URL",
        env: 'CM_API_URL',
    },
    cmApiSecret: {
        doc: 'Classifieds API Secret Name',
        format: String,
        default: "CM_API_SECRET_NAME",
        env: 'CM_API_SECRET_NAME',
    }
}
export const config = convict(configSchema).validate({ allowed: 'strict' });

