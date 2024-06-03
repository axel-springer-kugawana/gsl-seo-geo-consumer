import { poolInstance } from "./connectPostGre";
import { logger } from "@shared/cross-cutting/logger";

const initDatabase = async () => {
  const sqlDatabase = `
    DROP VIEW IF EXISTS v_immonet;
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
        isAuthorized boolean,
        isGeoDataValid boolean,
        isMarketStatusEligibleForPublication boolean,
        lat numeric,
        lon numeric,
        avivgeoid_ssot character varying COLLATE pg_catalog."default",
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
        CONSTRAINT pk_geo PRIMARY KEY (avivgeoid)
    )
    TABLESPACE pg_default;

    ALTER TABLE IF EXISTS public.geo
        OWNER TO main_user;

    CREATE TABLE IF NOT EXISTS public.geo_lat_lon
    (
        lon numeric NOT NULL,
        lat numeric NOT NULL,
        avivgeoid character varying COLLATE pg_catalog."default" NOT NULL,
        updatedate timestamp without time zone,
        CONSTRAINT pk_lat_lon PRIMARY KEY (lat, lon)
    )
    TABLESPACE pg_default;

    ALTER TABLE IF EXISTS public.geo_lat_lon
        OWNER TO main_user;

    CREATE OR REPLACE VIEW v_immonet AS
    SELECT c.classifiedid,
           c.estatetype,
           c.estatesubtype,
           c.distributiontype,
           c.avivgeoid,
           c.avivgeoid_ssot,
           c.country,
           c.postalcode,
           c.price,
           c.numberofrooms,
           c.furnished,
           c.yearofconstruction,
           c.certificateofeligibilityneeded,
           c.locationinbuilding,
           c.features,
           c.isAuthorized,
           c.isGeoDataValid,
           c.isMarketStatusEligibleForPublication,
           g.geolevel,
           g.countryid,
           g.regionid,
           g.microregionid,
           g.provinceid,
           g.municipalityid,
           g.boroughid,
           g.neighborhoodid,
           g.blocid
      FROM classified c
      LEFT JOIN geo g ON g.avivgeoid::text = c.avivgeoid::text
      WHERE c.brand::text = 'IWT'::text AND ('IMMONET'::text = ANY (c.portals))
      AND c.isauthorized IS TRUE
      AND c.isgeodatavalid IS TRUE
      AND c.ismarketstatuseligibleforpublication IS TRUE;

    ALTER TABLE v_immonet
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

export { initDatabase };