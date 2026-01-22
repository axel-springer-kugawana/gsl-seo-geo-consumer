import { config } from "@cm-connector/config/configuration-provider";
import { logger } from "@shared/cross-cutting/logger";
import { stringify } from "querystring";

const AWS_SECRETS_EXTENTION_SERVER_ENDPOINT = `http://localhost:2773/secretsmanager/get?secretId=`;

const getSecretValue = async (secretName: string) => {
  const url = `${AWS_SECRETS_EXTENTION_SERVER_ENDPOINT}${secretName}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN!,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Error occured while requesting secret ${secretName}. Responses status was ${response.status}`
    );
  }

  const secretContent = (await response.json()) as { SecretString: string };

  return secretContent.SecretString;
};

const getClassifiedApiSecret = async () => {
  const secretName = process.env.MV_APPLICATION_NAME+"-lambda_consumer_credentials"
  logger.info("Fetching Classified API secret", {secretName});
  
  const secretValue = await getSecretValue(secretName);
  const secret = JSON.parse(secretValue) as {
    DbPort: number;
    DbHostWriter: string;
    DbUsername: string;
    DbPassword: string;
    DbMainDatabase: string;
    GeoPlaceApiKey: string;
    GeoPlaceApiUrl: string;
  };

  return secret;
}

export { getClassifiedApiSecret };