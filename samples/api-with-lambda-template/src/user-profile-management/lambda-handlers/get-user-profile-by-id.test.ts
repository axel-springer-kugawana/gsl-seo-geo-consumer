import { AwsStub, mockClient } from 'aws-sdk-client-mock';
import {
  APIGatewayEventDefaultAuthorizerContext,
  APIGatewayEventRequestContextWithAuthorizer,
  APIGatewayProxyEvent
} from 'aws-lambda';
import {
  DynamoDBClient,
  DynamoDBClientResolvedConfig,
  GetItemCommand,
  ServiceInputTypes,
  ServiceOutputTypes
} from '@aws-sdk/client-dynamodb';
import { getUserProfileByIdHandler } from './get-user-profile-by-id';

describe('get contact request lambda', () => {
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

  test('returns 400 error when contact id is missing from path parameters', async () => {
    const apiGatewayEvent: APIGatewayProxyEvent = {
      body: 'eyJ0ZXN0IjoiYm9keSJ9',
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
    const result = await getUserProfileByIdHandler(apiGatewayEvent);

    // assert
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).type).toBe('missing-id');
  });

  test('returns 404 error when user profile is not found', async () => {
    const apiGatewayEvent: APIGatewayProxyEvent = {
      body: 'eyJ0ZXN0IjoiYm9keSJ9',
      resource: '/{proxy+}',
      path: '/path/to/resource',
      httpMethod: 'GET',
      isBase64Encoded: true,
      queryStringParameters: {
        id: '42'
      },
      multiValueQueryStringParameters: {
        foo: ['bar']
      },
      pathParameters: {
        proxy: '/profile',
        userId: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
      },
      stageVariables: {
        baz: 'qux'
      },
      headers: {},
      multiValueHeaders: {},
      requestContext:
        {} as APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>
    };

    dynamodbClientMock.on(GetItemCommand).resolves({
      $metadata: {
        httpStatusCode: 200
      },
      Item: undefined
    });

    // act
    const result = await getUserProfileByIdHandler(apiGatewayEvent);

    // assert
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).type).toBe('not-found');
  });

  test('returns 200 with a user profile in response body when a user profile is found', async () => {
    const apiGatewayEvent: APIGatewayProxyEvent = {
      body: 'eyJ0ZXN0IjoiYm9keSJ9',
      resource: '/{proxy+}',
      path: '/path/to/resource',
      httpMethod: 'GET',
      isBase64Encoded: true,
      queryStringParameters: {
        id: '42'
      },
      multiValueQueryStringParameters: {
        foo: ['bar']
      },
      pathParameters: {
        proxy: '/profile',
        userId: '42'
      },
      stageVariables: {
        baz: 'qux'
      },
      headers: {},
      multiValueHeaders: {},
      requestContext:
        {} as APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>
    };

    dynamodbClientMock.on(GetItemCommand).resolves({
      $metadata: {
        httpStatusCode: 200
      },
      Item: {
        id: { S: '42' },
        data: {
          S: JSON.stringify({
            firstName: 'chuck',
            lastName: 'norris',
            email: 'chuck@norris.com'
          })
        }
      }
    });

    // act
    const result = await getUserProfileByIdHandler(apiGatewayEvent);

    // assert
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({
      id: '42',
      firstName: 'chuck',
      lastName: 'norris',
      email: 'chuck@norris.com'
    });
  });
});
