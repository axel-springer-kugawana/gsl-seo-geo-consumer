import convict from 'convict';


const configSchema = {
    ssotBucketName: {
        doc: 'Bucket name for the SSOT',
        format: String,
        default: "SSOT_BUCKET_NAME",
        env: 'STATE_OF_WORLD_BUCKET',
    },
    ssotBucketHashRange: {
        doc: 'Hash range for the SSOT bucket',
        format: Number,
        default: 20_000,
        env: 'SSOT_BUCKET_HASH_RANGE',
    },
    ssotTopicArn : {
        doc: 'ssot topic arn',
        format: String,
        default: "",
        env: 'SSOT_TOPIC_ARN'
    }

}
export const config = convict(configSchema).validate({ allowed: 'strict' });

