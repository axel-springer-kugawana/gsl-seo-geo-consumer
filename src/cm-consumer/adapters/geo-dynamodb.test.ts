import { createDynamoDBClient, deleteItemsFromDynamoDB } from '@shared/adapters/dynamodb-client';
import { GEO_DYNAMODB_SCHEMA_VERSION } from '@shared/models/geo-dynamodb-schema-version';
import { softDeleteGeoFromReferential } from './geo-dynamodb';

jest.mock('@shared/adapters/dynamodb-client', () => ({
  createDynamoDBClient: jest.fn().mockReturnValue({}),
  deleteItemsFromDynamoDB: jest.fn(),
}));
jest.mock('@shared/cross-cutting/environment', () => ({
  requireEnvironmentVariable: jest.fn().mockReturnValue('features'),
}));

describe('softDeleteGeoFromReferential', () => {
  beforeEach(() => {
    jest.mocked(deleteItemsFromDynamoDB).mockReset().mockResolvedValue(0);
  });

  test('delegates to shared deletion with the feature key, timestamp and TTL', async () => {
    await softDeleteGeoFromReferential('old-id', '2026-11-02T10:00:00Z', 12345);

    expect(deleteItemsFromDynamoDB).toHaveBeenCalledWith(
      jest.mocked(createDynamoDBClient).mock.results[0].value,
      'features',
      [{ AvivGeoId: 'old-id', Version: GEO_DYNAMODB_SCHEMA_VERSION }],
      { mode: 'soft', updateDate: '2026-11-02T10:00:00Z', expiryTime: 12345 },
    );
  });

  test('propagates shared deletion failures', async () => {
    jest.mocked(deleteItemsFromDynamoDB).mockRejectedValueOnce(new Error('Delete failed'));

    await expect(softDeleteGeoFromReferential('old-id', '2026-11-02', 12345)).rejects.toThrow('Delete failed');
  });
});