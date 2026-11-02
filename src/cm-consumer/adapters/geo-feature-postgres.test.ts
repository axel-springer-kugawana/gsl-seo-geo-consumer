import { createPgClient } from '@shared/adapters/pg-client';
import { deleteGeoFeaturesInPG } from '@shared/adapters/geo-feature-postgres';
import { markGeoAsDeleted } from './geo-materialized-view-dynamodb';
import { softDeleteGeoFromReferential } from './geo-dynamodb';

jest.mock('@shared/adapters/pg-client', () => ({ createPgClient: jest.fn() }));
jest.mock('@shared/adapters/geo-feature-postgres', () => ({ deleteGeoFeaturesInPG: jest.fn() }));
jest.mock('./geo-api-secrets', () => ({ getGeoApiSecret: jest.fn() }));
jest.mock('@shared/cross-cutting/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('@shared/cross-cutting/environment', () => ({
  requireEnvironmentVariable: jest.fn().mockReturnValue('lineage'),
}));
jest.mock('./geo-dynamodb', () => ({
  persistDataInDynamoDB: jest.fn(),
  softDeleteGeoFromReferential: jest.fn(),
}));

describe('markGeoAsDeleted SQL deletion', () => {
  const client = { connect: jest.fn(), query: jest.fn(), end: jest.fn() };
  const command = {
    id: 'old-id',
    updateDate: '2026-11-02',
    geo: { id: 'old-id', deleted: { fallback: [] } } as never,
  };

  beforeEach(() => {
    jest.mocked(createPgClient).mockResolvedValue(client as never);
    jest.mocked(deleteGeoFeaturesInPG).mockReset().mockResolvedValue(1);
    jest.mocked(softDeleteGeoFromReferential).mockClear();
  });

  test('calls shared deletion directly using the consumer connection', async () => {
    await markGeoAsDeleted(command);

    expect(deleteGeoFeaturesInPG).toHaveBeenCalledWith(client, {
      source: 'ids', avivGeoIds: ['old-id'],
    });
    expect(client.end).not.toHaveBeenCalled();
  });

  test('propagates shared SQL deletion failures', async () => {
    jest.mocked(deleteGeoFeaturesInPG).mockRejectedValueOnce(new Error('SQL delete failed'));

    await expect(markGeoAsDeleted(command)).rejects.toThrow('SQL delete failed');
    expect(softDeleteGeoFromReferential).not.toHaveBeenCalled();
  });
});