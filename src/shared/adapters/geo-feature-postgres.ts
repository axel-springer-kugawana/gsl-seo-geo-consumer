import type { Client as PgClient } from 'pg';

type GeoFeatureDeleteTarget =
  | { source: 'ids'; avivGeoIds: string[] }
  | { source: 'lineage' };

export async function deleteGeoFeaturesInPG(client: PgClient, target: GeoFeatureDeleteTarget): Promise<number> {
  if (target.source === 'ids' && target.avivGeoIds.length === 0) {
    return 0;
  }

  const filter = target.source === 'lineage'
    ? 'USING public.geolineage lineage WHERE feature.avivgeoid = lineage.oldid'
    : 'WHERE feature.avivgeoid = ANY($1::text[])';
  let deletedFeatures = 0;

  for (const table of ['mv_geofeature_names', 'geoname', 'geofeature']) {
    const sql = `DELETE FROM public.${table} feature ${filter};`;
    const result = target.source === 'ids'
      ? await client.query(sql, [target.avivGeoIds])
      : await client.query(sql);
    if (table === 'geofeature') {
      deletedFeatures = result.rowCount ?? 0;
    }
  }

  return deletedFeatures;
}