import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { fromSSO } from "@aws-sdk/credential-provider-sso";

const isLocal = process.env.AWS_EXECUTION_ENV === undefined;

// Local dev has no Lambda/ECS execution role, so credentials are pulled from the AWS SSO profile instead.
export function createDynamoDBClient(region: string): DynamoDBClient {
    const config: DynamoDBClientConfig = { region };

    if (isLocal) {
        config.credentials = fromSSO({ profile: 'AvivPowerUserAccessReadWrite-135557783010' });
    }

    return new DynamoDBClient(config);
}