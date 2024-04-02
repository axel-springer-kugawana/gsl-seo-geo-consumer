import { AwsStub, mockClient } from 'aws-sdk-client-mock';
import {
  APIGatewayEventDefaultAuthorizerContext,
  APIGatewayEventRequestContextWithAuthorizer,
  APIGatewayProxyEvent
} from 'aws-lambda';
import {
  DynamoDBClient,
  DynamoDBClientResolvedConfig,
  PutItemCommand,
  ServiceInputTypes,
  ServiceOutputTypes
} from '@aws-sdk/client-dynamodb';
import { createUserProfileHandler } from './create-user-profile';

describe('create user profile lambda', () => {
  let dynamodbClientMock: AwsStub<
    ServiceInputTypes,
    ServiceOutputTypes,
    DynamoDBClientResolvedConfig
  >;
  beforeEach(() => {
    dynamodbClientMock = mockClient(DynamoDBClient);
  });

  afterEach(() => {
    dynamodbClientMock.reset();
    jest.resetAllMocks();
  });

  test('returns 400 error when provided payload is not a valid user profile request', async () => {
    const apiGatewayEvent: APIGatewayProxyEvent = {
      body: '{}',
      resource: '/{proxy+}',
      path: '/path/to/resource',
      httpMethod: 'GET',
      isBase64Encoded: true,
      queryStringParameters: {
        foo: 'bar'
      },
      multiValueQueryStringParameters: {
        foo: ['bar']
      },
      pathParameters: {
        proxy: '/profile'
      },
      stageVariables: {
        baz: 'qux'
      },
      headers: {},
      multiValueHeaders: {},
      requestContext:
        {} as APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>
    };

    // act
    const result = await createUserProfileHandler(apiGatewayEvent);

    // assert
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).type).toBe('validation-error');
  });

  test('returns 400 error when provided payload is missing a mandatory user profile field', async () => {
    const apiGatewayEvent: APIGatewayProxyEvent = {
      body: JSON.stringify({
        firstName: 'chuck',
        lastName: 'norris'
      }),
      resource: '/{proxy+}',
      path: '/path/to/resource',
      httpMethod: 'GET',
      isBase64Encoded: true,
      queryStringParameters: {
        foo: 'bar'
      },
      multiValueQueryStringParameters: {
        foo: ['bar']
      },
      pathParameters: {
        proxy: '/profile'
      },
      stageVariables: {
        baz: 'qux'
      },
      headers: {},
      multiValueHeaders: {},
      requestContext:
        {} as APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>
    };

    // act
    const result = await createUserProfileHandler(apiGatewayEvent);

    // assert
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).type).toBe('validation-error');
  });

  test('saves the user profile request and returns 200 when provided payload is a valid user profile', async () => {
    const apiGatewayEvent: APIGatewayProxyEvent = {
      body: JSON.stringify({
        firstName: 'chuck',
        lastName: 'norris',
        email: 'chuck@norris.email'
      }),
      resource: '/{proxy+}',
      path: '/path/to/resource',
      httpMethod: 'GET',
      isBase64Encoded: true,
      queryStringParameters: {
        foo: 'bar'
      },
      multiValueQueryStringParameters: {
        foo: ['bar']
      },
      pathParameters: {
        proxy: '/profile'
      },
      stageVariables: {
        baz: 'qux'
      },
      headers: {},
      multiValueHeaders: {},
      requestContext:
        {} as APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>
    };

    dynamodbClientMock.on(PutItemCommand).resolves({
      $metadata: {
        httpStatusCode: 200
      }
    });

    // act
    const result = await createUserProfileHandler(apiGatewayEvent);

    const command = dynamodbClientMock.commandCalls(PutItemCommand);

    expect(command.length).toBe(1);

    // assert
    expect(result.statusCode).toBe(200);
  });
});
