import { poolInstance } from "./connectPostGre";
import { logger } from "@shared/cross-cutting/logger";

const initDatabase = async () => {
  const sqlDatabase = `
    DROP VIEW IF EXISTS v_immonet;    
    DROP VIEW IF EXISTS v_immonet_all;
    DROP VIEW IF EXISTS v_classified;
    DROP TABLE IF EXISTS classified;
    DROP TABLE IF EXISTS geo;
    DROP TABLE IF EXISTS geo_lat_lon;

    CREATE TABLE IF NOT EXISTS public.classified
    (
        classifiedid character varying COLLATE pg_catalog."default" NOT NULL,
        brand character varying COLLATE pg_catalog."default",
        portals text[] COLLATE pg_catalog."default",
        estatetype character varying COLLATE pg_catalog."default",
        estatesubtype character varying COLLATE pg_catalog."default",
        distributiontype character varying COLLATE pg_catalog."default",
        avivgeoid character varying COLLATE pg_catalog."default",
        country character varying COLLATE pg_catalog."default",
        postalcode character varying COLLATE pg_catalog."default",
        price numeric,
        numberofrooms numeric,
        featuresincluded character varying COLLATE pg_catalog."default",
        features text[] COLLATE pg_catalog."default",
        furnished character varying COLLATE pg_catalog."default",
        yearofconstruction numeric,
        certificateofeligibilityneeded character varying COLLATE pg_catalog."default",
        locationinbuilding character varying COLLATE pg_catalog."default",
        isauthorized boolean,
        isgeodatavalid boolean,
        ismarketstatuseligibleforpublication boolean,
        lat double precision,
        lon double precision,
        location_type character varying COLLATE pg_catalog."default",
        projecttypes text[] COLLATE pg_catalog."default",
        showaddress boolean NOT NULL DEFAULT false,
        street character varying COLLATE pg_catalog."default",
        city character varying COLLATE pg_catalog."default",
        overallspace numeric,
        spacemin numeric,
        spacemax numeric,
        livingspace numeric,
        buildState character varying COLLATE pg_catalog."default",
        energyCertificateClass character varying COLLATE pg_catalog."default",
        CONSTRAINT "Classified_pkey" PRIMARY KEY (classifiedid)
    )
    TABLESPACE pg_default;

    ALTER TABLE IF EXISTS public.classified
        OWNER TO main_user;

    CREATE TABLE IF NOT EXISTS public.geo
    (
        avivgeoid character varying COLLATE pg_catalog."default" NOT NULL,
        geolevel numeric,
        countryid character varying COLLATE pg_catalog."default",
        regionid character varying COLLATE pg_catalog."default",
        microregionid character varying COLLATE pg_catalog."default",
        provinceid character varying COLLATE pg_catalog."default",
        municipalityid character varying COLLATE pg_catalog."default",
        boroughid character varying COLLATE pg_catalog."default",
        neighborhoodid character varying COLLATE pg_catalog."default",
        blocid character varying COLLATE pg_catalog."default",
        updatedate timestamp without time zone,
        municipalityname jsonb,
        neighborhoodname jsonb,
        CONSTRAINT pk_geo PRIMARY KEY (avivgeoid)
    )
    TABLESPACE pg_default;

    ALTER TABLE IF EXISTS public.geo
        OWNER TO main_user;

    CREATE TABLE IF NOT EXISTS public.geo_lat_lon
    (
        lon float NOT NULL,
        lat float NOT NULL,
        avivgeoid character varying COLLATE pg_catalog."default" NOT NULL,
        updatedate timestamp without time zone,
        CONSTRAINT pk_lat_lon PRIMARY KEY (lat, lon)
    )
    TABLESPACE pg_default;

    ALTER TABLE IF EXISTS public.geo_lat_lon
        OWNER TO main_user;
 
    CREATE OR REPLACE VIEW public.v_classified
    AS
      SELECT c.classifiedid,
          c.estatetype,
          c.estatesubtype,
          c.distributiontype,
          c.avivgeoid,
          c.location_type,
          c.country,
          c.city,
          c.postalcode,
          c.price,
          c.numberofrooms,
          c.livingspace,
          c.furnished,
          c.yearofconstruction,
          c.certificateofeligibilityneeded,
          c.locationinbuilding,
          c.features,
          c.isauthorized,
          c.isgeodatavalid,
          c.ismarketstatuseligibleforpublication,
          g.geolevel,
          g.countryid,
          g.regionid,
          g.microregionid,
          g.provinceid,
          g.municipalityid,
          g.municipalityname,
          g.boroughid,
          g.neighborhoodid,
          g.neighborhoodname,
          g.blocid,
          c.projecttypes,
          c.brand,
          c.portals,
          unnest(c.portals) AS portal,
          g.avivgeoid AS geo_avivgeoid,
          c.showaddress,
          c.street,
          c.buildState,
          c.energyCertificateClass
        FROM classified c
          LEFT JOIN geo_lat_lon geolatlon ON c.lat = geolatlon.lat AND c.lon = geolatlon.lon AND c.location_type::text = 'POINT'::text
          LEFT JOIN geo g ON g.avivgeoid::text = COALESCE(geolatlon.avivgeoid::text, c.avivgeoid::text);

    ALTER TABLE public.v_classified
        OWNER TO main_user;
  `;

  const pool = await poolInstance.getPool(); // Ensure you are getting the pool instance correctly

  try {
    const client = await pool.connect();
    try {
      await client.query(sqlDatabase);
      console.log('Database initialized successfully');
    } catch (e) {
      logger.error('Error executing SQL:', e);
    } finally {
      client.release();
    }
  } catch (e) {
    logger.error('Error connecting to the database:', e);
  }
};

const patchDatabase = async () => {
  const sqlDatabase = `

    ALTER TABLE classified
    ADD COLUMN energyCertificateClass character varying COLLATE pg_catalog."default";

    ALTER TABLE classified
    ADD COLUMN buildState character varying COLLATE pg_catalog."default";

   CREATE OR REPLACE VIEW public.v_classified
    AS
      SELECT c.classifiedid,
          c.estatetype,
          c.estatesubtype,
          c.distributiontype,
          c.avivgeoid,
          c.location_type,
          c.country,
          c.city,
          c.postalcode,
          c.price,
          c.numberofrooms,
          c.livingspace,
          c.furnished,
          c.yearofconstruction,
          c.certificateofeligibilityneeded,
          c.locationinbuilding,
          c.features,
          c.isauthorized,
          c.isgeodatavalid,
          c.ismarketstatuseligibleforpublication,
          g.geolevel,
          g.countryid,
          g.regionid,
          g.microregionid,
          g.provinceid,
          g.municipalityid,
          g.municipalityname,
          g.boroughid,
          g.neighborhoodid,
          g.neighborhoodname,
          g.blocid,
          c.projecttypes,
          c.brand,
          c.portals,
          unnest(c.portals) AS portal,
          g.avivgeoid AS geo_avivgeoid,
          c.showaddress,
          c.street,
          c.buildState,
          c.energyCertificateClass
        FROM classified c
          LEFT JOIN geo_lat_lon geolatlon ON c.lat = geolatlon.lat AND c.lon = geolatlon.lon AND c.location_type::text = 'POINT'::text
          LEFT JOIN geo g ON g.avivgeoid::text = COALESCE(geolatlon.avivgeoid::text, c.avivgeoid::text);

    ALTER TABLE public.v_classified
        OWNER TO main_user;`;

  try {
    await poolInstance.getPool().then(_pool => _pool.query(sqlDatabase)); // Ensure you are getting the pool instance correctly
    console.log('Database patched successfully');
  } catch (e) {
    logger.error('Error executing SQL:', e);
  }
};

const patchDatabaseV2 = async () => {
  const sqlDatabase = `

    DROP VIEW IF EXISTS v_classified;

    ALTER TABLE classified
    DROP COLUMN livingspace;

   CREATE OR REPLACE VIEW public.v_classified
    AS
      SELECT c.classifiedid,
          c.estatetype,
          c.estatesubtype,
          c.distributiontype,
          c.avivgeoid,
          c.location_type,
          c.country,
          c.city,
          c.postalcode,
          c.price,
          c.numberofrooms,
          c.overallspace,
          c.furnished,
          c.yearofconstruction,
          c.certificateofeligibilityneeded,
          c.locationinbuilding,
          c.features,
          c.isauthorized,
          c.isgeodatavalid,
          c.ismarketstatuseligibleforpublication,
          g.geolevel,
          g.countryid,
          g.regionid,
          g.microregionid,
          g.provinceid,
          g.municipalityid,
          g.municipalityname,
          g.boroughid,
          g.neighborhoodid,
          g.neighborhoodname,
          g.blocid,
          c.projecttypes,
          c.brand,
          c.portals,
          unnest(c.portals) AS portal,
          g.avivgeoid AS geo_avivgeoid,
          c.showaddress,
          c.street,
          c.buildState,
          c.energyCertificateClass
        FROM classified c
          LEFT JOIN geo_lat_lon geolatlon ON c.lat = geolatlon.lat AND c.lon = geolatlon.lon AND c.location_type::text = 'POINT'::text
          LEFT JOIN geo g ON g.avivgeoid::text = COALESCE(geolatlon.avivgeoid::text, c.avivgeoid::text);

    ALTER TABLE public.v_classified
        OWNER TO main_user;`;

  try {
    await poolInstance.getPool().then(_pool => _pool.query(sqlDatabase)); // Ensure you are getting the pool instance correctly
    console.log('Database patched successfully');
  } catch (e) {
    logger.error('Error executing SQL:', e);
  }
};



export { initDatabase, patchDatabase, patchDatabaseV2 };