import convict from 'convict';

const configSchema = {
  UserProfileTable: {
    doc: 'USER_PROFILE_TABLE',
    format: String,
    default: 'USER_PROFILE_TABLE',
    env: 'USER_PROFILE_TABLE'
  },
  UserByEmailIndex: {
    doc: 'USER_PROFILE_BY_EMAIL_GSI',
    format: String,
    default: 'USER_PROFILE_BY_EMAIL_GSI',
    env: 'USER_PROFILE_BY_EMAIL_GSI'
  }
};
export const config = convict(configSchema).validate({ allowed: 'strict' });
