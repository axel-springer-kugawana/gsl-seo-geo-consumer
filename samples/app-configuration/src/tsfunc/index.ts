import { AppConfigProvider } from "@aws-lambda-powertools/parameters/appconfig"
import { getParameter } from "@aws-lambda-powertools/parameters/ssm"
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"

const configsProvider = new AppConfigProvider({
	environment: "default",
})

export const handler = async (_: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	// static config
	const team = process.env.APP_TEAM as string
	const planet = process.env.APP_PLANET as string
	const account_name = await getParameter("/aft/account-request/custom-fields/account_name")

	// dynamic config
	const team_config = await configsProvider.get(team, { transform: "json" })

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: `Hello ${account_name}`,
			team,
			planet,
			team_config,
		}),
	}
}
