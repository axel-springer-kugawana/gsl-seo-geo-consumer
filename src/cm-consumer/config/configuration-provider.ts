import convict from 'convict';


const configSchema = {
    cmApiSecret: {
        doc: 'Classifieds API Secret Name',
        format: String,
        default: "CM_API_SECRET_NAME",
        env: 'CM_API_SECRET_NAME',
    }
}
export const config = convict(configSchema).validate({ allowed: 'strict' });

