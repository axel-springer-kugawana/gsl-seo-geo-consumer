import convict from 'convict';


const configSchema = {
    ssotBucketName: {
        doc: 'Bucket name for the SSOT',
        format: String,
        default: "SSOT_BUCKET_NAME",
        env: 'SSOT_SOTW_BUCKET_NAME',
    },
}
export const config = convict(configSchema).validate({ allowed: 'strict' });

