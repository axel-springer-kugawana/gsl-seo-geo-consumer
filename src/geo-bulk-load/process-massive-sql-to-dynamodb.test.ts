import { createDynamoDBClient, deleteItemsFromDynamoDB } from '@shared/adapters/dynamodb-client';
import { createPgClient } from '@shared/adapters/pg-client';
import { GEO_DYNAMODB_SCHEMA_VERSION } from '@shared/models/geo-dynamodb-schema-version';
import { cleanGeoFeaturesFromLineage } from './process-massive-sql-to-dynamodb';

jest.mock('@shared/adapters/dynamodb-client', () => ({
    createDynamoDBClient: jest.fn(),
    deleteItemsFromDynamoDB: jest.fn(),
    DYNAMODB_BATCH_WRITE_LIMIT: 25,
}));
jest.mock('@shared/adapters/pg-client', () => ({ createPgClient: jest.fn() }));
jest.mock('./geo-api-secrets', () => ({ getGeoApiSecret: jest.fn() }));
jest.mock('@shared/cross-cutting/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('@shared/cross-cutting/environment', () => ({
    requireEnvironmentVariable: jest.fn((name: string) => name === 'GEO_DYNAMODB_TABLE_NAME' ? 'features' : 'test'),
}));

describe('cleanGeoFeaturesFromLineage', () => {
    const pgClient = { connect: jest.fn(), query: jest.fn(), end: jest.fn() };
    const ddbClient = { destroy: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(createPgClient).mockResolvedValue(pgClient as never);
        jest.mocked(createDynamoDBClient).mockReturnValue(ddbClient as never);
        jest.mocked(deleteItemsFromDynamoDB).mockReset().mockResolvedValue(0);
        pgClient.query.mockReset().mockResolvedValue({ rows: [], rowCount: 0 });
    });

    function setPages(pages: { oldid: string }[][]): void {
        pgClient.query.mockImplementation(async (sql: string) => {
            if (sql.startsWith('FETCH ')) {
                return { rows: pages.shift() ?? [], rowCount: 0 };
            }
            return { rows: [], rowCount: 0 };
        });
    }

    test('soft-deletes distinct lineage old IDs, including IDs absent from SQL features, in batches of at most 25', async () => {
        const rows = Array.from({ length: 26 }, (_, index) => ({ oldid: `old-${index}` }));
        setPages([rows, [{ oldid: 'dynamo-only' }]]);

        await cleanGeoFeaturesFromLineage();

        expect(pgClient.query).toHaveBeenCalledWith(expect.stringContaining(
            'SELECT DISTINCT oldid FROM public.geolineage WHERE oldid IS NOT NULL',
        ));
        const calls = jest.mocked(deleteItemsFromDynamoDB).mock.calls;
        expect(calls.map(([, , keys]) => keys.length)).toEqual([25, 1, 1]);
        expect(calls.flatMap(([, , keys]) => keys)).toEqual([...rows, { oldid: 'dynamo-only' }].map((row) => ({
            AvivGeoId: row.oldid, Version: GEO_DYNAMODB_SCHEMA_VERSION,
        })));
        expect(calls.every(([, table]) => table === 'features')).toBe(true);
        const options = calls[0][3];
        expect(options.mode).toBe('soft');
        if (options.mode === 'soft') {
            expect(Date.parse(options.updateDate)).not.toBeNaN();
            expect(options.expiryTime).toBe(Math.floor(Date.parse(options.updateDate) / 1000) + 60 * 60 * 24);
        }
        expect(calls.map(([, , , callOptions]) => callOptions)).toEqual(Array(calls.length).fill(options));
        for (const table of ['geofeature', 'geoname', 'mv_geofeature_names']) {
            expect(pgClient.query).toHaveBeenCalledWith(expect.stringContaining(`DELETE FROM public.${table} feature`));
        }
        expect(pgClient.query).toHaveBeenCalledWith(expect.stringContaining('WHERE feature.avivgeoid = lineage.oldid'));
        expect(pgClient.query).toHaveBeenLastCalledWith('COMMIT');
        expect(pgClient.end).toHaveBeenCalledTimes(1);
        expect(ddbClient.destroy).toHaveBeenCalledTimes(1);
    });

    test('handles an empty lineage without DynamoDB writes', async () => {
        await cleanGeoFeaturesFromLineage();

        expect(deleteItemsFromDynamoDB).not.toHaveBeenCalled();
        expect(pgClient.query).toHaveBeenLastCalledWith('COMMIT');
    });

    test('rolls back without deleting SQL features when DynamoDB fails', async () => {
        setPages([[{ oldid: 'old-id' }]]);
        jest.mocked(deleteItemsFromDynamoDB).mockRejectedValueOnce(new Error('DynamoDB unavailable'));

        await expect(cleanGeoFeaturesFromLineage()).rejects.toThrow('DynamoDB unavailable');

        expect(pgClient.query).toHaveBeenLastCalledWith('ROLLBACK');
        expect(pgClient.query).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
        expect(pgClient.query).not.toHaveBeenCalledWith('COMMIT');
        expect(pgClient.end).toHaveBeenCalledTimes(1);
        expect(ddbClient.destroy).toHaveBeenCalledTimes(1);
    });

    test('rolls back and propagates SQL deletion failures', async () => {
        pgClient.query.mockImplementation(async (sql: string) => {
            if (sql.includes('DELETE FROM public.geofeature ')) {
                throw new Error('SQL delete failed');
            }
            return { rows: [], rowCount: 0 };
        });

        await expect(cleanGeoFeaturesFromLineage()).rejects.toThrow('SQL delete failed');

        expect(pgClient.query).toHaveBeenLastCalledWith('ROLLBACK');
        expect(pgClient.query).not.toHaveBeenCalledWith('COMMIT');
        expect(pgClient.end).toHaveBeenCalledTimes(1);
    });
});