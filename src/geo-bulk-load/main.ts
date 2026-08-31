import { DuckDBInstance } from '@duckdb/node-api';
import { accessSync, constants } from 'fs';
import { Client as PgClient } from 'pg';
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

  const FEATURE_ID_PREFIXES = [
    'AD02', 'AD03', 'AD04', 'AD05', 'AD06', 'AD07', 'AD08', 'AD09',
    'NBH1', 'NBH2', 'NBH3', 'STRTFR', 'HONUFR'
  ];
  const FEATURE_ID_EXCLUDED_PREFIXES = [
    'AD08MUNDO', 'AD06MUNDO', 'AD08MUNDO', 'AD06MUNDO', 'AD04MUNDO', 'AD02MUNDO'
  ];

  if (!PG_HOST || !PG_DATABASE || !PG_USER || !PG_PASSWORD || !bucket || !bucketKey) {
    throw new Error('[ECS Task] ERREUR: Variables PostgreSQL ou chemin S3 manquants.');
  }

  logger.info('[ECS Task] Initialisation de DuckDB via @duckdb/node-api...');

  // Création de l'instance et de la connexion asynchrone native
  const duckDbExtensionDirectory = process.env.DUCKDB_EXTENSION_DIRECTORY ?? '/opt/duckdb/extensions';
  const duckDbOptions = { extension_directory: duckDbExtensionDirectory };
  logger.info('[ECS Task] DuckDB extension directory: ' + duckDbExtensionDirectory);
  const instance = await DuckDBInstance.create(':memory:', duckDbOptions);
  const conn = await instance.connect();

  // DuckDB's postgres extension only supports ALTER TABLE ADD COLUMN and has no TRUNCATE support,
  // so DDL statements (CREATE/TRUNCATE/constraints) go through a real Postgres client instead.
  const pgClient = new PgClient({
    host: PG_HOST,
    port: Number(PG_PORT),
    database: PG_DATABASE,
    user: PG_USER,
    password: PG_PASSWORD,
  });
  await pgClient.connect();

  try {
    logger.info('[ECS Task] Chargement des extensions (httpfs, postgres, json)...');
    await conn.run('LOAD aws; LOAD httpfs; LOAD postgres; LOAD json;');

    // Caps DuckDB's own footprint below the Fargate task memory limit and lets it
    // spill to the ephemeral storage disk instead of getting OOM-killed by the container.
    const duckDbMemoryLimit = process.env.DUCKDB_MEMORY_LIMIT || '4GB';
    const duckDbTempDirectory = process.env.DUCKDB_TEMP_DIRECTORY || '/tmp/duckdb_spill';
    logger.info(`[ECS Task] DuckDB memory_limit=${duckDbMemoryLimit}, temp_directory=${duckDbTempDirectory}`);
    await conn.run(`SET memory_limit='${duckDbMemoryLimit}';`);
    await conn.run(`SET temp_directory='${duckDbTempDirectory}';`);
    // Avoids buffering the whole result set to preserve row order, which isn't needed for bulk inserts.
    await conn.run(`SET preserve_insertion_order=false;`);

    // Configuration S3
    const caCertFile = process.env.SSL_CERT_FILE || '/etc/ssl/certs/ca-certificates.crt';
    accessSync(caCertFile, constants.R_OK);
    logger.info('[ECS Task] CA certificate file: ' + caCertFile);
    await conn.run(`SET ca_cert_file='${caCertFile}';`);
    await conn.run(`SET s3_region='${AWS_REGION}';`);

    // Resolves credentials from env vars, ~/.aws/credentials or the ECS task role, in that order.
    logger.info('[ECS Task] Chargement des credentials AWS via load_aws_credentials()...');
    await conn.run(`CALL load_aws_credentials();`);

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

    console.log('store geo names start ...');
    0 await storeGeoNames();
    console.log('store geo names done...');

    console.log('store geo lineage start ...');
    await storeGeoLineage();
    console.log('store geo lineage done...');

    console.log('store geo feature start ...');
    await storeGeoFeature();
    console.log('store geo feature done...');


    logger.info('[ECS Task] TRAITEMENT TERMINÉ AVEC SUCCÈS !');
  } catch (error) {
    logger.error('[ECS Task] ERREUR CRITIQUE :' + error);
    throw error;
  } finally {
    conn.closeSync();
    instance.closeSync();
    await pgClient.end();
  }

  async function storeGeoLineage() {
    // Implementation for storing geo lineage
    const S3_PARQUET_PATH = bucket && bucketKey
      ? `s3://${bucket}/${bucketKey}/lineage/*.parquet`
      : undefined;

    // ÉTAPE 1 : Table temporaire UNLOGGED
    logger.info('[ECS Task] Étape 1/5 : Création de la table UNLOGGED...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoLineage_staging;`);

    await pgClient.query(`
      CREATE UNLOGGED TABLE ${PG_SCHEMA}.geoLineage_staging(
    newId character varying   NOT NULL,
    oldId character varying NOT NULL,
    key character varying  ,
    coefficient integer
);
    `);

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS ${PG_SCHEMA}.geoLineage
(
    newId character varying NOT NULL,
    oldId character varying NOT NULL,
    key character varying,
    coefficient integer
);
`);

    // Retire la PK et vide la table sans la supprimer, pour accélérer le bulk insert qui suit.
    await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.geoLineage DROP CONSTRAINT IF EXISTS geoLineage_pkey;`);
    await pgClient.query(`TRUNCATE TABLE ${PG_SCHEMA}.geoLineage;`);

    // ÉTAPE 2 : Bulk Copy vectorisé depuis Parquet S3
    logger.info('[ECS Task] Étape 2/5 : Insertion massive des 30M de lignes...');

    const featureIdPrefixFilter = FEATURE_ID_PREFIXES
      .map((prefix) => `NEW_ID LIKE '${prefix}%'`)
      .join(' OR ');

    const featureIdExclusionFilter = FEATURE_ID_EXCLUDED_PREFIXES
      .map((prefix) => `NEW_ID NOT LIKE '${prefix}%'`)
      .join(' AND ');

    await conn.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoLineage_staging (newId, oldId,  key, coefficient)
      SELECT 
        NEW_ID AS newId,
        OLD_ID AS oldId,
        KEY AS key,
        COEFFICIENT AS coefficient
      FROM read_parquet('${S3_PARQUET_PATH}')
      WHERE (${featureIdPrefixFilter})
      AND (${featureIdExclusionFilter});
    `);


    // ÉTAPE 3 : Insertion de toutes les lignes (la table cible vient d'être vidée)
    logger.info('[ECS Task] Étape 3/5 : INSERT des lignes...');
    await conn.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoLineage (newId, oldId,  key, coefficient)
      SELECT newId, oldId, key, coefficient
      FROM postgres_db.${PG_SCHEMA}.geoLineage_staging;
    `);

    // ÉTAPE 4 : on remet la contrainte de clé primaire sur la table finale
    logger.info('[ECS Task] Étape 4/5 : Remise de la contrainte de clé primaire...');

    await pgClient.query(`
     ALTER TABLE ${PG_SCHEMA}.geoLineage ADD CONSTRAINT geoLineage_pkey PRIMARY KEY (newId, oldId);
`);

    // ÉTAPE 5 : Nettoyage
    logger.info('[ECS Task] Étape 5/5 : Suppression de la table de Staging...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoLineage_staging;`);
  }


  async function storeGeoNames() {
    // Implementation for storing geo lineage
    const S3_PARQUET_PATH = bucket && bucketKey
      ? `s3://${bucket}/${bucketKey}/name/*.parquet`
      : undefined;

    // ÉTAPE 1 : Table temporaire UNLOGGED
    logger.info('[ECS Task] Étape 1/5 : Création de la table UNLOGGED...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoName_staging;`);

    await pgClient.query(`
      CREATE UNLOGGED TABLE ${PG_SCHEMA}.geoName_staging (
        avivGeoId character varying NOT NULL,
        language character varying,
        displayName character varying ,
        name character varying ,
        slug character varying ,
        key character varying 
      );
    `);

    await pgClient.query(`CREATE TABLE IF NOT EXISTS ${PG_SCHEMA}.geoName
(
    avivGeoId character varying NOT NULL,
    language character varying ,
    displayName character varying  ,
    name character varying ,
    slug character varying ,
    key character varying
);
`);

    // Retire la PK et vide la table sans la supprimer, pour accélérer le bulk insert qui suit.
    await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.geoName DROP CONSTRAINT IF EXISTS GeoName_pkey;`);
    await pgClient.query(`TRUNCATE TABLE ${PG_SCHEMA}.geoName;`);

    // ÉTAPE 2 : Bulk Copy vectorisé depuis Parquet S3
    logger.info('[ECS Task] Étape 2/5 : Insertion massive des 30M de lignes...');

    // AD02, AD03, AD04, AD05, AD06, AD07, AD08, POCO, AD09, NBH1, STU1, NBH2, STU2, NBH3, STU3, STRT, BLOC, PARC, BILD, HONU, POFI, SKOL
    const featureIdPrefixFilter = FEATURE_ID_PREFIXES
      .map((prefix) => `FEATURE_ID LIKE '${prefix}%'`)
      .join(' OR ');

    const featureIdExclusionFilter = FEATURE_ID_EXCLUDED_PREFIXES
      .map((prefix) => `FEATURE_ID NOT LIKE '${prefix}%'`)
      .join(' AND ');
    await conn.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoName_staging (avivGeoId, language, displayName, name, slug, key)
      SELECT DISTINCT
        FEATURE_ID AS avivGeoId,
        LANGUAGE AS language,
        DISPLAY_NAME AS displayName,
        NAME AS name,
        SLUG AS slug,
        KEY AS key
      FROM read_parquet('${S3_PARQUET_PATH}')
      WHERE (${featureIdPrefixFilter})
        AND (${featureIdExclusionFilter})
        AND LANGUAGE IS NOT NULL
        AND TRIM(LANGUAGE) != ''
        AND DISPLAY_NAME IS NOT NULL
        AND TRIM(DISPLAY_NAME) != ''
        AND RANK = 0;
    `);

    // ÉTAPE 3 : Insertion de toutes les lignes (la table cible vient d'être vidée)
    logger.info('[ECS Task] Étape 3/5 : INSERT des lignes...');
    await conn.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoName (avivGeoId, language, displayName, name, slug, key)
      SELECT avivGeoId, language, displayName, name, slug, key
      FROM postgres_db.${PG_SCHEMA}.geoName_staging;
    `);

    // ÉTAPE 4 : on remet la contrainte de clé primaire sur la table finale
    logger.info('[ECS Task] Étape 4/5 : Remise de la contrainte de clé primaire...');

    await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.geoName ADD CONSTRAINT GeoName_pkey PRIMARY KEY (avivGeoId, language);`);

    // ÉTAPE 5 : Nettoyage
    logger.info('[ECS Task] Étape 5/5 : Suppression de la table de Staging...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoName_staging;`);
  }

  async function storeGeoFeature() {
    // Implementation for storing geo lineage
    const S3_PARQUET_PATH = bucket && bucketKey
      ? `s3://${bucket}/${bucketKey}/feature/*.parquet`
      : undefined;

    // ÉTAPE 1 : Table temporaire UNLOGGED
    logger.info('[ECS Task] Étape 1/5 : Création de la table UNLOGGED...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoFeature_staging;`);

    await pgClient.query(`
      CREATE UNLOGGED TABLE ${PG_SCHEMA}.geoFeature_staging
(
    avivGeoId character varying NOT NULL,
    type character varying,
    mainPostalcode character varying,
    countryCode character varying,
    fictive boolean,
    level integer,
    postalCodes text[],
    parents text[],
    population integer
);
    `);

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS ${PG_SCHEMA}.geoFeature
(
    avivGeoId character varying NOT NULL,
    type character varying,
    mainPostalcode character varying,
    countryCode character varying,
    fictive boolean,
    level integer,
    postalCodes text[],
    parents text[],
    population integer
)
;
`);

    // Retire la PK et vide la table sans la supprimer, pour accélérer le bulk insert qui suit.
    await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.geoFeature DROP CONSTRAINT IF EXISTS GeoFeature_pkey;`);
    await pgClient.query(`TRUNCATE TABLE ${PG_SCHEMA}.geoFeature;`);

    // ÉTAPE 2 : Bulk Copy vectorisé depuis Parquet S3
    logger.info('[ECS Task] Étape 2/5 : Insertion massive des 30M de lignes...');


    const featureIdPrefixFilter = FEATURE_ID_PREFIXES
      .map((prefix) => `ID LIKE '${prefix}%'`)
      .join(' OR ');

    const featureIdExclusionFilter = FEATURE_ID_EXCLUDED_PREFIXES
      .map((prefix) => `ID NOT LIKE '${prefix}%'`)
      .join(' AND ');

    await conn.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoFeature_staging (avivGeoId, type, mainPostalcode, countryCode, fictive, level, postalCodes, parents, population)
      SELECT 
        ID AS avivGeoId,
        TYPE_LABEL AS type,
        MAIN_POSTAL_CODE AS mainPostalcode,
        COUNTRY_CODE AS countryCode,
        FICTIVE AS fictive,
        TYPE_LEVEL AS level,
        CAST(POSTAL_CODES AS JSON)::VARCHAR[] AS postalCodes,
        CAST(PARENTS AS JSON)::VARCHAR[] AS parents,
        POPULATION AS population
      FROM read_parquet('${S3_PARQUET_PATH}')
      WHERE (${featureIdPrefixFilter})
      AND (${featureIdExclusionFilter});
    `);

    // ÉTAPE 3 : Insertion de toutes les lignes (la table cible vient d'être vidée)
    logger.info('[ECS Task] Étape 3/5 : INSERT des lignes...');
    await conn.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoFeature (avivGeoId, type, mainPostalcode, countryCode, fictive, level, postalCodes, parents, population)
      SELECT avivGeoId, type, mainPostalcode, countryCode, fictive, level, postalCodes, parents, population
      FROM postgres_db.${PG_SCHEMA}.geoFeature_staging;
    `);

    // ÉTAPE 4 : on remet la contrainte de clé primaire sur la table finale
    await pgClient.query(`
     ALTER TABLE ${PG_SCHEMA}.geoFeature ADD CONSTRAINT GeoFeature_pkey PRIMARY KEY (avivGeoId);
`);
    // ÉTAPE 5 : Nettoyage
    logger.info('[ECS Task] Étape 5/5 : Suppression de la table de Staging...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoFeature_staging;`);

  }
}

if (require.main === module) {
  processMassiveParquetToPostgres().catch((error) => {
    logger.error('[ECS Task] ERREUR CRITIQUE :', error);
    process.exitCode = 1;
  });
}