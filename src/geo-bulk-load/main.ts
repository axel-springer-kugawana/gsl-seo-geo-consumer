import { DuckDBInstance } from '@duckdb/node-api';
import { accessSync, constants } from 'fs';
import { getClassifiedApiSecret } from "./classified-api-secrets";
import { logger } from "@shared/cross-cutting/logger";

export async function processMassiveParquetToPostgres() {

  logger.info('[ECS Task] Démarrage du traitement massif Parquet vers PostgreSQL...');

  logger.info('DB secrets..', {
    GEO_DB_SECRET_ID: process.env.GEO_DB_SECRET_ID,
  });

  const apisecrets = await getClassifiedApiSecret(process.env.GEO_DB_SECRET_ID || '');

   logger.info('secrets recupérés', {
    DbHostWriter: apisecrets.DbHostWriter,
    DbPort: apisecrets.DbPort,
    DbMainDatabase: apisecrets.DbMainDatabase,
    DbUsername: apisecrets.DbUsername,
    DbPassword: '********', // Masquer le mot de passe pour des raisons de sécurité
  });

  const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';
  const PG_HOST = apisecrets.DbHostWriter;
  const PG_PORT = apisecrets.DbPort;
  const PG_DATABASE = apisecrets.DbMainDatabase;
  const PG_USER = apisecrets.DbUsername;
  const PG_PASSWORD = apisecrets.DbPassword;
  const PG_SCHEMA = 'public';
  const bucket = process.env.GEO_MANAGEMENT_SYNC_BUCKET;
  const bucketKey = process.env.GEO_MANAGEMENT_BUCKET_KEY;
  const S3_PARQUET_PATH = bucket && bucketKey
    ? `s3://${bucket}/${bucketKey}/name/**/*.parquet`
    : undefined;

   // ÉTAPE 2 : Bulk Copy vectorisé depuis Parquet S3
    logger.info('[ECS Task] Étape 0/5 : variables',{
      bucket:  bucket,
      bucketKey: bucketKey,
      bucketPath: S3_PARQUET_PATH
    });


  if (!PG_HOST || !PG_DATABASE || !PG_USER || !PG_PASSWORD || !S3_PARQUET_PATH) {
    throw new Error('[ECS Task] ERREUR: Variables PostgreSQL ou chemin S3 manquants.');
  }

  logger.info('[ECS Task] Initialisation de DuckDB via @duckdb/node-api...');

  // Création de l'instance et de la connexion asynchrone native
  const duckDbExtensionDirectory = process.env.DUCKDB_EXTENSION_DIRECTORY ?? '/opt/duckdb/extensions';
  const duckDbOptions = { extension_directory: duckDbExtensionDirectory };
  logger.info('[ECS Task] DuckDB extension directory: ' + duckDbExtensionDirectory);
  const instance = await DuckDBInstance.create(':memory:', duckDbOptions);
  const conn = await instance.connect();

  try {
    logger.info('[ECS Task] Chargement des extensions (httpfs, postgres)...');
    await conn.run('LOAD aws; LOAD httpfs; LOAD postgres;');

    // Configuration S3
    const caCertFile = process.env.SSL_CERT_FILE || '/etc/ssl/certs/ca-certificates.crt';
    accessSync(caCertFile, constants.R_OK);
    logger.info('[ECS Task] CA certificate file: ' + caCertFile);
    await conn.run(`SET ca_cert_file='${caCertFile}';`);
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
    logger.info(`[ECS Task] Connexion à PostgreSQL (${PG_HOST}:${PG_PORT}/${PG_DATABASE})...`);
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
    logger.info('[ECS Task] Étape 1/5 : Création de la table UNLOGGED...');
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
    logger.info('[ECS Task] Étape 2/5 : Insertion massive des 30M de lignes...');


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
    logger.info('[ECS Task] Étape 3/5 : UPDATE des lignes existantes...');
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
    logger.info('[ECS Task] Étape 4/5 : INSERT des nouvelles lignes...');
    await conn.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}."geoName" ("avivGeoId", language, "displayName", name, slug)
      SELECT s."avivGeoId", s.language, s."displayName", s.name, s.slug
      FROM postgres_db.${PG_SCHEMA}."geoName_staging" s
      LEFT JOIN postgres_db.${PG_SCHEMA}."geoName" target 
        ON target."avivGeoId" = s."avivGeoId" AND target.language = s.language
      WHERE target."avivGeoId" IS NULL;
    `);

    // ÉTAPE 5 : Nettoyage
    logger.info('[ECS Task] Étape 5/5 : Suppression de la table de Staging...');
    await conn.run(`DROP TABLE postgres_db.${PG_SCHEMA}."geoName_staging";`);

    logger.info('[ECS Task] TRAITEMENT TERMINÉ AVEC SUCCÈS !');
  } catch (error) {
    logger.error('[ECS Task] ERREUR CRITIQUE :' + error);
    try {
      await conn.run(`DROP TABLE IF EXISTS postgres_db.${PG_SCHEMA}."geoName_staging";`);
    } catch (_) { }
    throw error;
  } finally {
    conn.closeSync();
    instance.closeSync();
  }
}

if (require.main === module) {
  processMassiveParquetToPostgres().catch((error) => {
    logger.error('[ECS Task] ERREUR CRITIQUE :', error);
    process.exitCode = 1;
  });
}