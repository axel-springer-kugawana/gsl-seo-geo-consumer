import { getSecret } from "@aws-lambda-powertools/parameters/secrets";
import type { SecretsGetOptions } from "@aws-lambda-powertools/parameters/secrets/types";
import { logger } from "@shared/cross-cutting/logger";

const getSecretValue = async (secretName: string) => {  
  const options: SecretsGetOptions = { maxAge: 120 }

  const secret = await getSecret(secretName, options)

  if (secret === undefined) {
    logger.error(`Secret ${secretName} not found`)
    throw new Error(`Secret ${secretName} not found`)
  }
  return secret.toString()
}

export const getSecrets = async <T>(secretName: string): Promise<T> => {
  const secretValue = await getSecretValue(secretName)

  return JSON.parse(secretValue) as T
}

export const getSecretsAsString = async (secretName: string): Promise<string> =>
  await getSecretValue(secretName)


export type GeoSSOTSecret = {
  DbPort: number;
  DbHostWriter: string;
  DbUsername: string;
  DbPassword: string;
  DbMainDatabase: string;
  GeoPlaceApiKey: string;
  GeoPlaceApiUrl: string;
};

export const getClassifiedApiSecret = async (secretName: string): Promise<GeoSSOTSecret> => {
  const secrets = await getSecretValue(secretName)
  const secret = JSON.parse(secrets) as GeoSSOTSecret;

  logger.info('secrets recupérés', {
    DbHostWriter: secret.DbHostWriter,
    DbPort: secret.DbPort,
    DbMainDatabase: secret.DbMainDatabase,
    DbUsername: secret.DbUsername,
    DbPassword: '********', // Mask the password for security reasons
  });
  return secret;
}