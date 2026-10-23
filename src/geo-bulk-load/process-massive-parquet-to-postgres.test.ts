import { DuckDBInstance } from '@duckdb/node-api';
import { createPgClient } from '@shared/adapters/pg-client';
import { logger } from '@shared/cross-cutting/logger';
import { getGeoApiSecret } from './geo-api-secrets';
import { parquetLinksToPG, parquetGeoLineageToPG, parquetGeoFeatureToPG } from './process-massive-parquet-to-postgres';

jest.mock('@duckdb/node-api', () => ({ DuckDBInstance: { create: jest.fn() } }));
jest.mock('@shared/adapters/pg-client', () => ({ createPgClient: jest.fn() }));
jest.mock('./geo-api-secrets', () => ({ getGeoApiSecret: jest.fn() }));
jest.mock('@shared/cross-cutting/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('@shared/cross-cutting/environment', () => ({
  requireEnvironmentVariable: jest.fn().mockReturnValue('test'),
}));
jest.mock('fs', () => ({ ...jest.requireActual('fs'), accessSync: jest.fn() }));

describe('Parquet to PostgreSQL workflows', () => {
  const connection = { run: jest.fn(), closeSync: jest.fn() };
  const instance = { connect: jest.fn(), closeSync: jest.fn() };
  const pgClient = { connect: jest.fn(), query: jest.fn(), end: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    connection.run.mockResolvedValue(undefined);
    instance.connect.mockResolvedValue(connection);
    pgClient.query.mockResolvedValue(undefined);
    jest.mocked(DuckDBInstance.create).mockResolvedValue(instance as never);
    jest.mocked(createPgClient).mockResolvedValue(pgClient as never);
    jest.mocked(getGeoApiSecret).mockResolvedValue({
      DbHostWriter: 'localhost',
      DbMainDatabase: 'geo',
      DbUsername: 'test',
      DbPassword: 'test',
      DbPort: 5432,
    } as never);
  });

  function queries(): string {
    return [...connection.run.mock.calls, ...pgClient.query.mock.calls]
      .map(([sql]) => sql)
      .join('\n');
  }

  test('loads lineage without touching features, names, links or views', async () => {
    await parquetGeoLineageToPG();

    expect(queries()).toContain('INSERT INTO postgres_db.public.geoLineage');
    expect(queries()).not.toMatch(/geoFeature|geoName|geoLink|v_geo_full|mv_geofeature_names/i);
    expect(connection.closeSync).toHaveBeenCalledTimes(1);
    expect(instance.closeSync).toHaveBeenCalledTimes(1);
    expect(pgClient.end).toHaveBeenCalledTimes(1);
  });

  test('loads the complete feature workflow without touching lineage or links', async () => {
    await parquetGeoFeatureToPG();

    expect(queries()).toContain('INSERT INTO postgres_db.public.geoName');
    expect(queries()).toContain('INSERT INTO postgres_db.public.geoFeature');
    expect(queries()).toContain('SET streetIds = streets.streetIds');
    expect(queries()).toContain('INSERT INTO public.mv_geofeature_names');
    expect(queries()).toContain('CREATE OR REPLACE VIEW public.v_geo_full');
    expect(queries()).not.toMatch(/geoLineage|geoLink/i);
    expect(pgClient.end).toHaveBeenCalledTimes(1);
  });

  test('parquetLinksToPG loads only links', async () => {
    await parquetLinksToPG();

    expect(queries()).toContain('INSERT INTO postgres_db.public.geoLink_staging');
    expect(queries()).toContain('INSERT INTO public.geoLink');
    expect(queries()).not.toMatch(/geoLineage|geoFeature|geoName|v_geo_full|mv_geofeature_names/i);
    expect(connection.closeSync).toHaveBeenCalledTimes(1);
    expect(instance.closeSync).toHaveBeenCalledTimes(1);
    expect(pgClient.end).toHaveBeenCalledTimes(1);
  });

  test('copies staging rows to final tables directly in PostgreSQL', async () => {
    await parquetGeoLineageToPG();
    await parquetGeoFeatureToPG();

    for (const table of ['geoLineage', 'geoName', 'geoFeature']) {
      expect(pgClient.query).toHaveBeenCalledWith(expect.stringContaining(`INSERT INTO public.${table} (`));
      expect(connection.run).not.toHaveBeenCalledWith(expect.stringContaining(`INSERT INTO postgres_db.public.${table} (`));
      expect(connection.run).toHaveBeenCalledWith(expect.stringContaining(`INSERT INTO postgres_db.public.${table}_staging`));
    }
  });

  test('selects one lowest-ranked name per feature and language before insertion', async () => {
    await parquetGeoFeatureToPG();

    expect(pgClient.query).toHaveBeenCalledWith(expect.stringContaining(
      'SELECT DISTINCT ON (avivGeoId, language)',
    ));
    expect(pgClient.query).toHaveBeenCalledWith(expect.stringContaining(
      'ORDER BY avivGeoId, language, rank ASC NULLS LAST',
    ));
    expect(pgClient.query).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM public.geoName'));
  });

  test.each([
    { workflow: 'lineage', run: parquetGeoLineageToPG, steps: ['storeGeoLineage'] },
    { workflow: 'feature', run: parquetGeoFeatureToPG, steps: ['storeGeoNames', 'storeGeoFeature', 'updateMunicipalityStreetIds', 'createOrRefreshMaterializedView'] },
    { workflow: 'links', run: parquetLinksToPG, steps: ['storeGeoLinks'] },
  ])('runs $workflow steps in order with generic workflow logs', async ({ workflow, run, steps }) => {
    await run();

    const stepLogs = jest.mocked(logger.info).mock.calls
      .map(([message]) => message)
      .filter((message) => typeof message === 'string' && message.startsWith(`[ECS Task] ${workflow}:`));

    expect(stepLogs).toEqual([
      `[ECS Task] ${workflow}: Parquet to PostgreSQL start ...`,
      ...steps.flatMap((step) => [
        `[ECS Task] ${workflow}: ${step} start ...`,
        `[ECS Task] ${workflow}: ${step} done...`,
      ]),
      `[ECS Task] ${workflow}: Parquet to PostgreSQL done...`,
    ]);
  });

  test.each([parquetGeoLineageToPG, parquetGeoFeatureToPG, parquetLinksToPG])(
    'propagates failures and closes resources for %p',
    async (workflow) => {
      const error = new Error('PostgreSQL unavailable');
      pgClient.query.mockRejectedValueOnce(error);

      await expect(workflow()).rejects.toThrow(error);

      expect(connection.closeSync).toHaveBeenCalledTimes(1);
      expect(instance.closeSync).toHaveBeenCalledTimes(1);
      expect(pgClient.end).toHaveBeenCalledTimes(1);
    },
  );
});