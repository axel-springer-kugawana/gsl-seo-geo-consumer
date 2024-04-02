import { AwsStub, mockClient } from 'aws-sdk-client-mock';
import {
  APIGatewayEventDefaultAuthorizerContext,
  APIGatewayEventRequestContextWithAuthorizer,
  APIGatewayProxyEvent
} from 'aws-lambda';
import {
  DeleteItemCommand,
  DynamoDBClient,
  DynamoDBClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes
} from '@aws-sdk/client-dynamodb';
import { deleteUserProfileHandler } from './delete-user-profile';

describe('delete user profile lambda', () => {
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

  test('returns 400 error when userId is missing from the path parameters', async () => {
    const apiGatewayEvent: APIGatewayProxyEvent = {
      body: '',
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
    const result = await deleteUserProfileHandler(apiGatewayEvent);

    // assert
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).type).toBe('missing-id');
  });

  test('returns 500 when delete operation fails', async () => {
    const apiGatewayEvent: APIGatewayProxyEvent = {
      body: '',
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
        proxy: '/profile',
        userId: '643aa331-c018-4abd-87ec-8cc323444cc4'
      },
      stageVariables: {
        baz: 'qux'
      },
      headers: {},
      multiValueHeaders: {},
      requestContext:
        {} as APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>
    };

    dynamodbClientMock.on(DeleteItemCommand).resolves({
      $metadata: {
        httpStatusCode: 400
      }
    });

    // act
    const result = await deleteUserProfileHandler(apiGatewayEvent);

    // assert
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).type).toBe('internal-server-error');
  });

  test('returns 204 when user profile deletion is successfull', async () => {
    const apiGatewayEvent: APIGatewayProxyEvent = {
      body: '',
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
        proxy: '/profile',
        userId: '643aa331-c018-4abd-87ec-8cc323444cc4'
      },
      stageVariables: {
        baz: 'qux'
      },
      headers: {},
      multiValueHeaders: {},
      requestContext:
        {} as APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>
    };

    dynamodbClientMock.on(DeleteItemCommand).resolves({
      $metadata: {
        httpStatusCode: 200
      }
    });

    // act
    const result = await deleteUserProfileHandler(apiGatewayEvent);

    const command = dynamodbClientMock.commandCalls(DeleteItemCommand);

    expect(command.length).toBe(1);

    // assert
    expect(result.statusCode).toBe(204);
  });
});
