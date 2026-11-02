import type { Client as PgClient } from 'pg';
import { deleteGeoFeaturesInPG } from './geo-feature-postgres';

describe('deleteGeoFeaturesInPG', () => {
  const client = { query: jest.fn() };

  beforeEach(() => {
    client.query.mockReset().mockResolvedValue({ rowCount: 2 });
  });

  test('deletes feature projections and names with parameterized IDs', async () => {
    const ids = ['old-id', "id'with-quote"];

    await expect(deleteGeoFeaturesInPG(client as unknown as PgClient, {
      source: 'ids', avivGeoIds: ids,
    })).resolves.toBe(2);

    expect(client.query.mock.calls).toEqual(
      ['mv_geofeature_names', 'geoname', 'geofeature'].map((table) => [
        `DELETE FROM public.${table} feature WHERE feature.avivgeoid = ANY($1::text[]);`,
        [ids],
      ]),
    );
  });

  test('uses lineage old IDs without loading them into memory', async () => {
    await deleteGeoFeaturesInPG(client as unknown as PgClient, { source: 'lineage' });

    expect(client.query.mock.calls).toEqual(
      ['mv_geofeature_names', 'geoname', 'geofeature'].map((table) => [
        `DELETE FROM public.${table} feature USING public.geolineage lineage WHERE feature.avivgeoid = lineage.oldid;`,
      ]),
    );
  });

  test('does not execute SQL for an empty ID list', async () => {
    await expect(deleteGeoFeaturesInPG(client as unknown as PgClient, {
      source: 'ids', avivGeoIds: [],
    })).resolves.toBe(0);

    expect(client.query).not.toHaveBeenCalled();
  });

  test('returns only the feature deletion count', async () => {
    client.query.mockResolvedValueOnce({ rowCount: 10 })
      .mockResolvedValueOnce({ rowCount: 20 })
      .mockResolvedValueOnce({ rowCount: 3 });

    await expect(deleteGeoFeaturesInPG(client as unknown as PgClient, { source: 'lineage' })).resolves.toBe(3);
  });

  test('propagates SQL errors without managing the caller transaction', async () => {
    client.query.mockRejectedValueOnce(new Error('SQL delete failed'));

    await expect(deleteGeoFeaturesInPG(client as unknown as PgClient, {
      source: 'lineage',
    })).rejects.toThrow('SQL delete failed');

    expect(client.query).toHaveBeenCalledTimes(1);
  });
});