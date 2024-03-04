import { AppConfigProvider } from "@aws-lambda-powertools/parameters/appconfig"
import { getParameter } from "@aws-lambda-powertools/parameters/ssm"
import { handler } from "./index"

jest.mock("@aws-lambda-powertools/parameters/ssm", () => ({
	getParameter: jest.fn(),
}))
const mockedGetParameter = getParameter as jest.MockedFunction<typeof getParameter>

jest.mock("@aws-lambda-powertools/parameters/appconfig")
const mockedAppConfigProvider = AppConfigProvider as jest.MockedClass<typeof AppConfigProvider>

describe("Lambda tests", () => {
	const env = process.env

	beforeEach(() => {
		mockedGetParameter.mockClear()
		mockedAppConfigProvider.mockClear()
		jest.resetModules()
		process.env = { ...env }
	})

	afterEach(() => {
		process.env = env
	})

	test("it returns the correct response", async () => {
		mockedGetParameter.mockResolvedValue("MyName")
		process.env.APP_TEAM = "MyTeam"
		process.env.APP_PLANET = "MyPlanet"
		// @ts-ignore
		mockedAppConfigProvider.prototype.get.mockResolvedValue({ foo: "bar" })

		const result = await handler({
			body: "",
			headers: {},
			multiValueHeaders: {},
			httpMethod: "GET",
			isBase64Encoded: false,
			path: "/",
			pathParameters: null,
			queryStringParameters: null,
			multiValueQueryStringParameters: null,
			stageVariables: null,
			requestContext: {
				accountId: "",
				apiId: "",
				authorizer: {},
				protocol: "",
				httpMethod: "",
				identity: {
					sourceIp: "",
					accessKey: null,
					accountId: null,
					apiKey: null,
					apiKeyId: null,
					caller: null,
					clientCert: null,
					cognitoAuthenticationProvider: null,
					cognitoAuthenticationType: null,
					cognitoIdentityId: null,
					cognitoIdentityPoolId: null,
					principalOrgId: null,
					user: null,
					userAgent: null,
					userArn: null,
				},
				path: "",
				stage: "",
				requestId: "",
				requestTimeEpoch: 0,
				resourceId: "",
				resourcePath: "",
			},
			resource: "",
		})

		expect(JSON.parse(result.body)).toEqual({
			message: "Hello MyName",
			team: "MyTeam",
			planet: "MyPlanet",
			team_config: {
				foo: "bar",
			},
		})
	})
})
