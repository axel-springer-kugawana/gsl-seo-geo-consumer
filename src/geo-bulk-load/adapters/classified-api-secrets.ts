import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const secretsManager = new SecretsManagerClient({});

const getClassifiedApiSecret = async () => {
  const secretId = process.env.GEO_DB_SECRET_ID;
  if (!secretId) {
    throw new Error("GEO_DB_SECRET_ID is required");
  }

  const response = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );
  if (!response.SecretString) {
    throw new Error(`Secret ${secretId} does not contain SecretString`);
  }

  const secretValue = response.SecretString;
  const secret = JSON.parse(secretValue) as {
    DbPort: number;
    DbHostWriter: string;
    DbUsername: string;
    DbPassword: string;
    DbMainDatabase: string;
    GeoPlaceApiKey: string;
    GeoPlaceApiUrl: string;
  };

  if (!secret.DbUsername || !secret.DbPassword) {
    throw new Error(`Secret ${secretId} must contain DbUsername and DbPassword`);
  }

  return secret;
}

export { getClassifiedApiSecret };