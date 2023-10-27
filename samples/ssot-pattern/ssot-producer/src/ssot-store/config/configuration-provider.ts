import convict from 'convict';


const configSchema = {
  
    ssotTable: {
        doc: 'Name of the SSOT table',
        format: String,
        default: "",
        env: 'SSOT_TABLE_NAME',
    }
}
export const config = convict(configSchema).validate({ allowed: 'strict' });

