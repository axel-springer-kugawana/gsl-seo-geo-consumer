import { config } from "@cm-connector/config/configuration-provider";
import { logger } from "@shared/cross-cutting/logger";

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
  const secretName = config.get("cmApiSecret");
  const secretValue = await getSecretValue(secretName);
  const secret = JSON.parse(secretValue) as {
    Host: string;
    Username: string;
    Password: string;
    Database: string;
  };

  return secret;
}

export { getClassifiedApiSecret };