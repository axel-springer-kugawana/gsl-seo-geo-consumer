import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';
import { accessSync, constants } from 'fs';
import { Client as PgClient } from 'pg';
import { getClassifiedApiSecret, type GeoSSOTSecret } from "./classified-api-secrets";
import { logger } from "@shared/cross-cutting/logger";


const MANAGED_PREFIX_IDS = [
  'AD02', 'AD03', 'AD04', 'AD05', 'AD06', 'AD07', 'AD08', 'AD09',
  'NBH1', 'NBH2', 'NBH3', 'STRTFR', 'HONUFR'
];
// Municipalities forced to fictive=true (mergers/splits not reflected in FICTIVE on the source side)
const FAKE_PROVINCES_IDS = [
  'AD06DE144', 'AD06DE307', 'AD06DE155', 'AD06DE160', 'AD06DE161', 'AD06DE162', 'AD06DE163',
  'AD06DE164', 'AD06DE165', 'AD06DE166', 'AD06DE167', 'AD06DE168', 'AD06DE169', 'AD06DE180',
  'AD06DE186', 'AD06DE193', 'AD06DE194', 'AD06DE197', 'AD06DE198', 'AD06DE201', 'AD06DE205',
  'AD06DE218', 'AD06DE224', 'AD06DE225', 'AD06DE226', 'AD06DE247', 'AD06DE248', 'AD06DE249',
  'AD06DE259', 'AD06DE260', 'AD06DE261', 'AD06DE269', 'AD06DE270', 'AD06DE271', 'AD06DE272',
  'AD06DE282', 'AD06DE283', 'AD06DE284', 'AD06DE285', 'AD06DE286', 'AD06DE294', 'AD06DE295',
  'AD06DE296', 'AD06DE306', 'AD06DE308', 'AD06DE309', 'AD06DE326', 'AD06DE327', 'AD06DE328',
  'AD06DE329', 'AD06DE330', 'AD06DE345', 'AD06DE346', 'AD06DE353', 'AD06DE358', 'AD06DE363',
  'AD06DE366', 'AD06DE367', 'AD06DE368', 'AD06DE380', 'AD06DE381', 'AD06DE382', 'AD06DE383',
  'AD06DE384', 'AD06DE385', 'AD06DE16', 'AD06DE17', 'AD06DE18', 'AD06DE19', 'AD06DE46',
  'AD06DE47', 'AD06DE48', 'AD06DE49', 'AD06DE50', 'AD06DE63', 'AD06DE64', 'AD06DE65',
  'AD06DE72', 'AD06DE66', 'AD06DE67', 'AD06DE68', 'AD06DE69', 'AD06DE70', 'AD06DE71',
  'AD06DE73', 'AD06DE74', 'AD06DE80', 'AD06DE81', 'AD06DE82', 'AD06DE91', 'AD06DE92',
  'AD06DE93', 'AD06DE1', 'AD06DE2', 'AD06DE3', 'AD06DE4', 'AD06DE99', 'AD06DE106',
  'AD06DE107', 'AD06DE108', 'AD06DE109', 'AD06DE110', 'AD06DE118', 'AD06DE119', 'AD06DE120',
  'AD06DE121', 'AD06DE137'
];
const PG_SCHEMA = 'public';

export async function processMassiveParquetToPostgres() {

  logger.info('[ECS Task] Démarrage du traitement massif Parquet vers PostgreSQL...');
  const secrets = await getClassifiedApiSecret(process.env.GEO_DB_SECRET_ID || '');

  const duckDBClient = await createDuckDBClient(secrets);
  const duckDBConnection = await setupDuckDBConnection(duckDBClient, secrets);

  // DuckDB's postgres extension only supports ALTER TABLE ADD COLUMN and has no TRUNCATE support,
  // so DDL statements (CREATE/TRUNCATE/constraints) go through a real Postgres client instead.
  const pgClient = await createPgClient(secrets);
  await pgClient.connect();
  try {
    console.log('store geo names start ...');
    await storeGeoNames();
    console.log('store geo names done...');

    console.log('store geo lineage start ...');
    await storeGeoLineage();
    console.log('store geo lineage done...');

    console.log('store geo feature start ...');
    await storeGeoFeature();
    console.log('store geo feature done...');

    console.log('update municipality street ids start ...');
    await updateMunicipalityStreetIds();
    console.log('update municipality street ids done...');

    console.log('create or refresh materialized view start ...');
    await createOrRefreshMaterializedView();
    console.log('create or refresh materialized view done...');

    logger.info('[ECS Task] TRAITEMENT TERMINÉ AVEC SUCCÈS !');
  } catch (error) {
    logger.error('[ECS Task] ERREUR CRITIQUE :' + error);
    throw error;
  } finally {
    duckDBConnection.closeSync();
    duckDBClient.closeSync();
    await pgClient.end();
  }

  async function storeGeoLineage() {
    // Implementation for storing geo lineage
    const S3_PARQUET_PATH = getS3ParquetPath('lineage');

    // STEP 1: Temporary UNLOGGED table
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

    // Drop the PK and empty the table without dropping it, to speed up the bulk insert that follows.
    await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.geoLineage DROP CONSTRAINT IF EXISTS geoLineage_pkey;`);
    await pgClient.query(`TRUNCATE TABLE ${PG_SCHEMA}.geoLineage;`);

    // STEP 2: Vectorized bulk copy from Parquet S3
    logger.info('[ECS Task] Étape 2/5 : Insertion massive des 30M de lignes...');

    const featureIdPrefixFilter = MANAGED_PREFIX_IDS
      .map((prefix) => `NEW_ID LIKE '${prefix}%'`)
      .join(' OR ');

    // postgres_clear_cache() doesn't exist in this extension version: force the catalog
    // refresh by detaching/re-attaching the database so the staging table becomes visible.
    await postgresClearCache(duckDBConnection, secrets);
    await duckDBConnection.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoLineage_staging (newId, oldId,  key, coefficient)
      SELECT 
        NEW_ID AS newId,
        OLD_ID AS oldId,
        KEY AS key,
        COEFFICIENT AS coefficient
      FROM read_parquet('${S3_PARQUET_PATH}')
      WHERE (${featureIdPrefixFilter})`);

    // STEP 3: Insert all rows (the target table has just been emptied)
    logger.info('[ECS Task] Étape 3/5 : INSERT des lignes...');
    await duckDBConnection.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoLineage (newId, oldId,  key, coefficient)
      SELECT newId, oldId, key, coefficient
      FROM postgres_db.${PG_SCHEMA}.geoLineage_staging;
    `);

    // STEP 4: Re-add the primary key constraint on the final table
    logger.info('[ECS Task] Étape 4/5 : Remise de la contrainte de clé primaire...');

    await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.geoLineage ADD CONSTRAINT geoLineage_pkey PRIMARY KEY (newId, oldId);
`);

    // STEP 5: Cleanup
    logger.info('[ECS Task] Étape 5/5 : Suppression de la table de Staging...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoLineage_staging;`);
  }


  function getS3ParquetPath(path: string): string | undefined {

    const bucket = process.env.GEO_MANAGEMENT_SYNC_BUCKET;
    const bucketKey = process.env.GEO_MANAGEMENT_BUCKET_KEY;


    return bucket && bucketKey
      ? `s3://${bucket}/${bucketKey}/${path}/*.parquet`
      : undefined;
  }

  async function storeGeoNames() {
    const S3_PARQUET_PATH = getS3ParquetPath('name');

    // STEP 1: Temporary UNLOGGED table
    logger.info('[ECS Task] Étape 1/5 : Création de la table UNLOGGED...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoName_staging;`);

    await pgClient.query(`
      CREATE UNLOGGED TABLE ${PG_SCHEMA}.geoName_staging (
        avivGeoId character varying NOT NULL,
        language character varying,
        displayName character varying ,
        name character varying ,
        slug character varying ,
        key character varying ,
        rank integer
      );
    `);

    await pgClient.query(`CREATE TABLE IF NOT EXISTS ${PG_SCHEMA}.geoName
              (avivGeoId character varying NOT NULL,
              language character varying ,
              displayName character varying  ,
              name character varying ,
              slug character varying ,
              key character varying,
              rank integer);
`);

    // Drop the PK and empty the table without dropping it, to speed up the bulk insert that follows.
    await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.geoName DROP CONSTRAINT IF EXISTS GeoName_pkey;`);
    await pgClient.query(`TRUNCATE TABLE ${PG_SCHEMA}.geoName;`);

    // STEP 2: Vectorized bulk copy from Parquet S3
    logger.info('[ECS Task] Étape 2/5 : Insertion massive des 30M de lignes...');

    const featureIdPrefixFilter = MANAGED_PREFIX_IDS
      .map((prefix) => `FEATURE_ID LIKE '${prefix}%'`)
      .join(' OR ');

    await postgresClearCache(duckDBConnection, secrets);
    await duckDBConnection.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoName_staging (avivGeoId, language, displayName, name, slug, key, rank)
      SELECT 
        FEATURE_ID AS avivGeoId,
        LANGUAGE AS language,
        DISPLAY_NAME AS displayName,
        NAME AS name,
        SLUG AS slug,
        KEY AS key,
        RANK AS rank  
      FROM read_parquet('${S3_PARQUET_PATH}')
      WHERE (${featureIdPrefixFilter})
        AND LANGUAGE IS NOT NULL
        AND TRIM(LANGUAGE) != ''
        AND DISPLAY_NAME IS NOT NULL
        AND TRIM(DISPLAY_NAME) != ''
        ;
    `);

    // STEP 3: Insert all rows (the target table has just been emptied)
    logger.info('[ECS Task] Étape 3/5 : INSERT des lignes...');
    await duckDBConnection.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoName (avivGeoId, language, displayName, name, slug, key, rank)
      SELECT avivGeoId, language, displayName, name, slug, key, rank
      FROM postgres_db.${PG_SCHEMA}.geoName_staging;
    `);

    // STEP 4: Deduplicate rows and re-add the primary key constraint
    logger.info('[ECS Task] Étape 4/5 : Suppression des doublons et remise de la contrainte de clé primaire...');
    await pgClient.query(`
      WITH a_supprimer AS (
        SELECT *
        FROM (
          SELECT v.avivGeoId, v.language, v.rank,
                 ROW_NUMBER() OVER (PARTITION BY v.avivGeoId, v.language ORDER BY v.rank) AS pos
          FROM (
            SELECT avivGeoId, language
            FROM ${PG_SCHEMA}.geoName
            GROUP BY avivGeoId, language
            HAVING COUNT(*) > 1
          ) tmp
          INNER JOIN ${PG_SCHEMA}.geoName v
            ON tmp.avivGeoId = v.avivGeoId
            AND tmp.language = v.language
        ) tmp2
        WHERE pos > 1
      )
      DELETE FROM ${PG_SCHEMA}.geoName g
      USING a_supprimer s
      WHERE g.avivGeoId = s.avivGeoId
        AND g.language = s.language
        AND g.rank = s.rank;
    `);

    await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.geoName ADD CONSTRAINT GeoName_pkey PRIMARY KEY (avivGeoId, language);`);

    // STEP 5: Cleanup
    logger.info('[ECS Task] Étape 5/5 : Suppression de la table de Staging...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoName_staging;`);
  }

  async function storeGeoFeature(): Promise<void> {
    const S3_PARQUET_PATH = getS3ParquetPath('feature');


    // STEP 1: Temporary UNLOGGED table
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
    population integer,
    countryId character varying,
    regionId character varying,
    provinceId character varying,
    municipalityId character varying,
      streetIds text[],
    neighbors text[]
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
    population integer, 
    countryId character varying,
    regionId character varying,
    provinceId character varying,
    municipalityId character varying,
    streetIds text[],
    neighbors text[]
);
`);

    await pgClient.query(`
      ALTER TABLE ${PG_SCHEMA}.geoFeature
        ADD COLUMN IF NOT EXISTS streetIds text[];
    `);

    // Drop the PK and empty the table without dropping it, to speed up the bulk insert that follows.
    await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.geoFeature DROP CONSTRAINT IF EXISTS GeoFeature_pkey;`);
  await pgClient.query(`DROP INDEX IF EXISTS ${PG_SCHEMA}.idx_geofeature_streets_by_municipality;`);
    await pgClient.query(`TRUNCATE TABLE ${PG_SCHEMA}.geoFeature;`);

    // STEP 2: Vectorized bulk copy from Parquet S3
    logger.info('[ECS Task] Étape 2/5 : Insertion massive des 30M de lignes...');
    const featureIdPrefixFilter = MANAGED_PREFIX_IDS
      .map((prefix) => `ID LIKE '${prefix}%'`)
      .join(' OR ');
    const fictiveMunicipalityIdsList = FAKE_PROVINCES_IDS
      .map((id) => `'${id}'`)
      .join(', ');

    await postgresClearCache(duckDBConnection, secrets);

    await duckDBConnection.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoFeature_staging (avivGeoId, type, mainPostalcode, countryCode, fictive, level, postalCodes, parents
      , population
      , countryId
      , regionId
      , provinceId
      , municipalityId,
      streetIds,
      neighbors)
      SELECT 
        ID AS avivGeoId,
        TYPE_LABEL AS type,
        MAIN_POSTAL_CODE AS mainPostalcode,
        COUNTRY_CODE AS countryCode,
        CASE WHEN ID IN (${fictiveMunicipalityIdsList}) THEN true ELSE FICTIVE END AS fictive,
        TYPE_LEVEL AS level,
        POSTAL_CODES::JSON::VARCHAR[] AS postalCodes,
        PARENTS::JSON::VARCHAR[] AS parents,
        POPULATION AS population,
        (AD02->>0)::VARCHAR AS countryId,
        (AD04->>0)::VARCHAR AS regionId,
        (AD06->>0)::VARCHAR AS provinceId,
        (AD08->>0)::VARCHAR AS municipalityId,
        STRT::JSON::VARCHAR[] AS streetIds,
        NEIGHBORS::JSON::VARCHAR[] AS neighbors
      FROM read_parquet('${S3_PARQUET_PATH}')
      WHERE (${featureIdPrefixFilter})
     `);

    // STEP 3: Insert all rows (the target table has just been emptied)
    logger.info('[ECS Task] Étape 3/5 : INSERT des lignes...');
    await duckDBConnection.run(`
      INSERT INTO postgres_db.${PG_SCHEMA}.geoFeature (avivGeoId, type, mainPostalcode, countryCode, fictive, level
      , postalCodes, parents, population, countryId,
      regionId, provinceId, municipalityId, streetIds, neighbors)
      SELECT avivGeoId, type, mainPostalcode, countryCode, fictive, level, postalCodes, parents, population
      , countryId, regionId, provinceId, municipalityId, streetIds, neighbors
      FROM postgres_db.${PG_SCHEMA}.geoFeature_staging;
    `);

    // STEP 4: Re-add the primary key constraint on the final table
    await pgClient.query(`
     ALTER TABLE ${PG_SCHEMA}.geoFeature ADD CONSTRAINT GeoFeature_pkey PRIMARY KEY (avivGeoId);
`);
    // STEP 5: Cleanup
    logger.info('[ECS Task] Étape 5/5 : Suppression de la table de Staging...');
    await pgClient.query(`DROP TABLE IF EXISTS ${PG_SCHEMA}.geoFeature_staging;`);
  }

  async function updateMunicipalityStreetIds(): Promise<void> {
    logger.info('[ECS Task] Mise à jour des streetIds des municipalités...');

    await pgClient.query(`
      CREATE INDEX IF NOT EXISTS idx_geofeature_streets_by_municipality
        ON ${PG_SCHEMA}.geoFeature (municipalityId, avivGeoId)
        WHERE level = 1200
          AND municipalityId IS NOT NULL;
    `);

    await pgClient.query(`
      UPDATE ${PG_SCHEMA}.geoFeature municipality
      SET streetIds = streets.streetIds
      FROM (
        SELECT municipalityId, array_agg(avivGeoId ORDER BY avivGeoId) AS streetIds
        FROM ${PG_SCHEMA}.geoFeature
        WHERE level = 1200
          AND municipalityId IS NOT NULL
        GROUP BY municipalityId
      ) streets
      WHERE municipality.avivGeoId = streets.municipalityId;
    `);

    logger.info('[ECS Task] streetIds des municipalités mis à jour avec succès.');
  }

  async function createOrRefreshMaterializedView() {
    logger.info('[ECS Task] Création ou rafraîchissement de la vue matérialisée...');

    try {
      // Check whether the MV already exists
      const mvExists = await pgClient.query(
        `SELECT 1 FROM information_schema.views WHERE table_schema = $1 AND table_name = $2`,
        [PG_SCHEMA, 'mv_geofeature_names']
      );

      if (mvExists.rows.length > 0) {
        // MV exists: refresh with CONCURRENTLY (requires a unique index)
        logger.info('[ECS Task] Vue matérialisée existe, rafraîchissement en cours...');
        try {
          await pgClient.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${PG_SCHEMA}.mv_geofeature_names;`);
        } catch (error) {
          // If CONCURRENTLY fails (no unique index), fall back to a plain refresh
          logger.warn('[ECS Task] Rafraîchissement CONCURRENTLY échoué, utilisation du mode standard');
          await pgClient.query(`REFRESH MATERIALIZED VIEW ${PG_SCHEMA}.mv_geofeature_names;`);
        }
      } else {
        // MV doesn't exist: create it
        logger.info('[ECS Task] Création de la vue matérialisée...');
        await pgClient.query(`
          CREATE MATERIALIZED VIEW IF NOT EXISTS ${PG_SCHEMA}.mv_geofeature_names
          TABLESPACE pg_default
          AS
           SELECT f.avivgeoid,
              f.type,
              f.mainpostalcode AS code,
              f.countrycode,
              f.fictive,
              f.level,
              json_agg(jsonb_build_object('displayname', g.displayname, 'name', g.name, 'slug', g.slug, 'language', g.language)) AS names
             FROM ${PG_SCHEMA}.geofeature f
               LEFT JOIN ${PG_SCHEMA}.geoname g ON f.avivgeoid::text = g.avivgeoid::text
            WHERE f.type::text = ANY (ARRAY['Country'::character varying::text, 'Region'::character varying::text, 'Province'::character varying::text, 'Municipality'::character varying::text, 'Street'::character varying::text])
            GROUP BY f.avivgeoid, f.type, f.mainpostalcode, f.countrycode, f.fictive, f.level
          WITH DATA;
        `);
      }

      // Create the unique index if it doesn't already exist
      logger.info('[ECS Task] Création de l\'index unique...');
      await pgClient.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_geofeature_avivgeoid
          ON ${PG_SCHEMA}.mv_geofeature_names USING btree
          (avivgeoid COLLATE pg_catalog."default")
          TABLESPACE pg_default;
      `);

      logger.info('[ECS Task] Vue matérialisée créée/rafraîchie avec succès !');

      // Create/update the v_geo_full view
      logger.info('[ECS Task] Création ou remplacement de la vue v_geo_full...');
      await pgClient.query(`DROP VIEW IF EXISTS ${PG_SCHEMA}.v_geo_full;`);
      await pgClient.query(`
        CREATE OR REPLACE VIEW ${PG_SCHEMA}.v_geo_full
         AS
         SELECT geo.avivgeoid,
            geo.type,
            geo.mainpostalcode,
            geo.countrycode,
            geo.fictive,
            geo.level,
            geo.postalcodes,
            geo.parents,
            geo.population,
            geo.countryid,
            geo.regionid,
            geo.provinceid,
            geo.municipalityid,
            country.code,
            country.fictive AS countryfictive,
            country.level AS countrylevel,
            country.names AS countrynames,
            region.code AS regioncode,
            region.fictive AS regionfictive,
            region.level AS regionlevel,
            region.names AS regionnames,
            province.code AS provincecode,
            province.fictive AS provincefictive,
            province.level AS provincelevel,
            province.names AS provincenames,
            municipality.code AS municipalitycode,
            municipality.fictive AS municipalityfictive,
            municipality.level AS municipalitylevel,
            municipality.names AS municipalitynames,
            geo.names,
            street.code AS streetcode,
            street.fictive AS streetfictive,
            street.level AS streetlevel,
            street.names AS streetnames,
            geo.streetids
           FROM ( SELECT geo_1.avivgeoid,
                    geo_1.type,
                    geo_1.mainpostalcode,
                    geo_1.countrycode,
                    geo_1.fictive,
                    geo_1.level,
                    geo_1.postalcodes,
                    geo_1.parents,
                    geo_1.population,
                    geo_1.countryid,
                    geo_1.regionid,
                    geo_1.provinceid,
                    geo_1.municipalityid,
                    geo_1.streetids,
                    json_agg(jsonb_build_object('displayname', g.displayname, 'name', g.name, 'slug', g.slug, 'language', g.language)) AS names
                   FROM ${PG_SCHEMA}.geofeature geo_1
                     LEFT JOIN ${PG_SCHEMA}.geoname g ON g.avivgeoid::text = geo_1.avivgeoid::text
                     GROUP BY geo_1.avivgeoid, geo_1.type, geo_1.mainpostalcode, geo_1.countrycode, geo_1.fictive, geo_1.level, geo_1.postalcodes, geo_1.parents, geo_1.population, geo_1.countryid, geo_1.regionid, geo_1.provinceid, geo_1.municipalityid, geo_1.streetids) geo
             LEFT JOIN ${PG_SCHEMA}.mv_geofeature_names country ON country.avivgeoid::text = geo.countryid::text OR country.avivgeoid::text = geo.avivgeoid::text AND geo.level = 200
             LEFT JOIN ${PG_SCHEMA}.mv_geofeature_names region ON region.avivgeoid::text = geo.regionid::text OR region.avivgeoid::text = geo.avivgeoid::text AND geo.level = 400
             LEFT JOIN ${PG_SCHEMA}.mv_geofeature_names province ON province.avivgeoid::text = geo.provinceid::text OR province.avivgeoid::text = geo.avivgeoid::text AND geo.level = 600
             LEFT JOIN ${PG_SCHEMA}.mv_geofeature_names municipality ON municipality.avivgeoid::text = geo.municipalityid::text OR municipality.avivgeoid::text = geo.avivgeoid::text AND geo.level = 800
                   LEFT JOIN ${PG_SCHEMA}.mv_geofeature_names street ON street.avivgeoid::text = geo.streetids[1]::text OR street.avivgeoid::text = geo.avivgeoid::text AND geo.level = 1200;
      `);
      logger.info('[ECS Task] Vue v_geo_full créée/remplacée avec succès !');
    } catch (error) {
      logger.error('[ECS Task] ERREUR lors de la gestion de la vue matérialisée :' + error);
      throw error;
    }
  }
}

async function createDuckDBClient(secrets: GeoSSOTSecret): Promise<DuckDBInstance> {
  const bucket = process.env.GEO_MANAGEMENT_SYNC_BUCKET;
  const bucketKey = process.env.GEO_MANAGEMENT_BUCKET_KEY;

  if (!secrets.DbHostWriter || !secrets.DbMainDatabase || !secrets.DbUsername || !secrets.DbPassword || !bucket || !bucketKey) {
    throw new Error('[ECS Task] ERREUR: Variables PostgreSQL ou chemin S3 manquants.');
  }

  logger.info('[ECS Task] Initialisation de DuckDB via @duckdb/node-api...');

  // Création de l'instance et de la connexion asynchrone native
  const duckDbExtensionDirectory = process.env.DUCKDB_EXTENSION_DIRECTORY ?? '/opt/duckdb/extensions';
  const duckDbOptions = { extension_directory: duckDbExtensionDirectory };
  logger.info('[ECS Task] DuckDB extension directory: ' + duckDbExtensionDirectory);
  const instance = await DuckDBInstance.create(':memory:', duckDbOptions);
  return instance;
}

// Refreshes DuckDB's catalog of the attached Postgres database, so that newly created tables become visible to DuckDB.
async function postgresClearCache(conn: DuckDBConnection, secrets: GeoSSOTSecret) {
  const escapedPgConnString = createPgConnectionString(secrets);
  await conn.run('DETACH postgres_db;');
  await conn.run(`ATTACH '${escapedPgConnString}' AS postgres_db (TYPE POSTGRES);`);
}

async function setupDuckDBConnection(instance: DuckDBInstance, secrets: GeoSSOTSecret): Promise<DuckDBConnection> {
  const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';

  const conn = await instance.connect();

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
  logger.info(`[ECS Task] Connexion à PostgreSQL (${secrets.DbHostWriter}:${secrets.DbPort}/${secrets.DbMainDatabase})...`);
  const escapedPgConnString = createPgConnectionString(secrets);
  await conn.run(`ATTACH '${escapedPgConnString}' AS postgres_db (TYPE POSTGRES);`);

  return conn;
}

function createPgConnectionString(secrets: GeoSSOTSecret) {
  const quoteConninfoValue = (value: string | number) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const pgConnString = [
    `dbname=${quoteConninfoValue(secrets.DbMainDatabase)}`,
    `user=${quoteConninfoValue(secrets.DbUsername)}`,
    `password=${quoteConninfoValue(secrets.DbPassword)}`,
    `host=${quoteConninfoValue(secrets.DbHostWriter)}`,
    `port=${quoteConninfoValue(secrets.DbPort)}`,
  ].join(' ');
  const escapedPgConnString = pgConnString.replace(/'/g, "''");
  return escapedPgConnString;
}
function createPgClient(secrets: GeoSSOTSecret): Promise<PgClient> {
  const pgClient = new PgClient({
    host: secrets.DbHostWriter,
    port: Number(secrets.DbPort),
    database: secrets.DbMainDatabase,
    user: secrets.DbUsername,
    password: secrets.DbPassword,
  });
  return Promise.resolve(pgClient);
}
