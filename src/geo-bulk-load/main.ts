import { DuckDBInstance } from '@duckdb/node-api';
import { getClassifiedApiSecret } from "../classified-api-secrets";
export async function processMassiveParquetToPostgres() {
  const apisecrets = await getClassifiedApiSecret();
  const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';
  const PG_HOST = process.env.GEO_DB_HOST || apisecrets.DbHostWriter;
  const PG_PORT = process.env.GEO_DB_PORT || apisecrets.DbPort;
  const PG_DATABASE = process.env.GEO_DB_NAME || apisecrets.DbMainDatabase;
  const PG_USER = apisecrets.DbUsername;
  const PG_PASSWORD = apisecrets.DbPassword;
  const PG_SCHEMA = process.env.GEO_DB_SCHEMA || 'public';
  const bucket = process.env.GEO_MANAGEMENT_SYNC_BUCKET;
  const bucketKey = process.env.GEO_MANAGEMENT_BUCKET_KEY;
  const S3_PARQUET_PATH = bucket && bucketKey
    ? `s3://${bucket}/${bucketKey}/name/**/*.parquet`
    : undefined;

  if (!PG_HOST || !PG_DATABASE || !PG_USER || !PG_PASSWORD || !S3_PARQUET_PATH) {
    throw new Error('[ECS Task] ERREUR: Variables PostgreSQL ou chemin S3 manquants.');
  }

  console.log('[ECS Task] Initialisation de DuckDB via @duckdb/node-api...');
  
  // Création de l'instance et de la connexion asynchrone native
  const instance = await DuckDBInstance.create(':memory:');
  const conn = await instance.connect();

  try {
    console.log('[ECS Task] Chargement des extensions (httpfs, postgres)...');
    await conn.run('LOAD aws; LOAD httpfs; LOAD postgres;');

    // Configuration S3
    await conn.run(`SET s3_region='${AWS_REGION}';`);

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      await conn.run(`
        SET s3_access_key_id='${process.env.AWS_ACCESS_KEY_ID}';
        SET s3_secret_access_key='${process.env.AWS_SECRET_ACCESS_KEY}';
      `);
      if (process.env.AWS_SESSION_TOKEN) {
        await conn.run(`SET s3_session_token='${process.env.AWS_SESSION_TOKEN}';`);
      }
    }

    // Connexion à PostgreSQL
    console.log(`[ECS Task] Connexion à PostgreSQL (${PG_HOST}:${PG_PORT}/${PG_DATABASE})...`);
    const quoteConninfoValue = (value: string | number) =>
      `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    const pgConnString = [
      `dbname=${quoteConninfoValue(PG_DATABASE)}`,
      `user=${quoteConninfoValue(PG_USER)}`,
      `password=${quoteConninfoValue(PG_PASSWORD)}`,
      `host=${quoteConninfoValue(PG_HOST)}`,
      `port=${quoteConninfoValue(PG_PORT)}`,
    ].join(' ');
    const escapedPgConnString = pgConnString.replace(/'/g, "''");
    await conn.run(`ATTACH '${escapedPgConnString}' AS postgres_db (TYPE POSTGRES);`);

    // ÉTAPE 1 : Table temporaire UNLOGGED
    console.log('[ECS Task] Étape 1/5 : Création de la table UNLOGGED...');
    await conn.run(`
      CREATE UNLOGGED TABLE postgres_db.${PG_SCHEMA}."geoName_staging" (
        "avivGeoId" character varying NOT NULL,
        language character varying NOT NULL,
        "displayName" character varying NOT NULL,
        name character varying NOT NULL,
        slug character varying NOT NULL
      );
    `);

    // ÉTAPE 2 : Bulk Copy vectorisé depuis Parquet S3
    console.log('[ECS Task] Étape 2/5 : Insertion massive des 30M de lignes...');
    await conn.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}."geoName_staging" ("avivGeoId", language, "displayName", name, slug)
      SELECT 
        FEATURE_ID AS "avivGeoId",
        LANGUAGE AS language,
        DISPLAY_NAME AS "displayName",
        NAME AS name,
        SLUG AS slug
      FROM read_parquet('${S3_PARQUET_PATH}');
    `);

    // ÉTAPE 3 : Update des enregistrements existants
    console.log('[ECS Task] Étape 3/5 : UPDATE des lignes existantes...');
    await conn.run(`
      UPDATE postgres_db.${PG_SCHEMA}."geoName" target
      SET 
        "displayName" = s."displayName",
        name = s.name,
        slug = s.slug
      FROM postgres_db.${PG_SCHEMA}."geoName_staging" s
      WHERE target."avivGeoId" = s."avivGeoId" AND target.language = s.language;
    `);

    // ÉTAPE 4 : Insertion des nouvelles lignes
    console.log('[ECS Task] Étape 4/5 : INSERT des nouvelles lignes...');
    await conn.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}."geoName" ("avivGeoId", language, "displayName", name, slug)
      SELECT s."avivGeoId", s.language, s."displayName", s.name, s.slug
      FROM postgres_db.${PG_SCHEMA}."geoName_staging" s
      LEFT JOIN postgres_db.${PG_SCHEMA}."geoName" target 
        ON target."avivGeoId" = s."avivGeoId" AND target.language = s.language
      WHERE target."avivGeoId" IS NULL;
    `);

    // ÉTAPE 5 : Nettoyage
    console.log('[ECS Task] Étape 5/5 : Suppression de la table de Staging...');
    await conn.run(`DROP TABLE postgres_db.${PG_SCHEMA}."geoName_staging";`);

    console.log('[ECS Task] TRAITEMENT TERMINÉ AVEC SUCCÈS !');
  } catch (error) {
    console.error('[ECS Task] ERREUR CRITIQUE :', error);
    try {
      await conn.run(`DROP TABLE IF EXISTS postgres_db.${PG_SCHEMA}."geoName_staging";`);
    } catch (_) {}
    throw error;
  } finally {
    conn.closeSync();
    instance.closeSync();
  }
}

if (require.main === module) {
  processMassiveParquetToPostgres().catch((error) => {
    console.error('[ECS Task] ERREUR CRITIQUE :', error);
    process.exitCode = 1;
  });
}