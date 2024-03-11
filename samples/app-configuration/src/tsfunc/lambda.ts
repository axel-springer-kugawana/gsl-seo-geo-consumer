import { AppConfigProvider } from "@aws-lambda-powertools/parameters/appconfig"
import { getParameter } from "@aws-lambda-powertools/parameters/ssm"
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"

const configsProvider = new AppConfigProvider({
	environment: "default",
})

export const handler = async (_: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	// static config
	const team = process.env.APP_TEAM as string
	const domain = process.env.APP_DOMAIN as string
	const account_name = await getParameter("/aft/account-request/custom-fields/account_name")

	// dynamic config
	const progressiveRollout = await configsProvider.get("ProgressiveRollout", { transform: "json" })

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: `Hello ${account_name}`,
			team,
			domain,
			progressiveRollout,
		}),
	}
}
