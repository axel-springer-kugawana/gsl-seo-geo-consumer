import { poolInstance } from "./connectPostGre";
import { logger } from "@shared/cross-cutting/logger";

const initDatabase = async () => {
  const sqlDatabase = `
    DROP VIEW IF EXISTS v_immonet;    
    DROP VIEW IF EXISTS v_immonet_all;
    DROP VIEW IF EXISTS v_classified;
    DROP VIEW IF EXISTS v_classified_v2;
    DROP TABLE IF EXISTS classified;
    DROP TABLE IF EXISTS geo;
    DROP TABLE IF EXISTS geo_lat_lon;

    -- Table: public.classified

-- DROP TABLE IF EXISTS public.classified;

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
    spacemin numeric,
    spacemax numeric,
    energycertificateclass character varying COLLATE pg_catalog."default",
    buildstate character varying COLLATE pg_catalog."default",
    overallspace numeric,
    livingspace numeric,
    classifiedbusiness character varying COLLATE pg_catalog."default",
    showprice boolean DEFAULT true,
    israngeprice boolean DEFAULT false,
    space numeric,
    updatedate timestamp without time zone,
    ssotupdatedate timestamp without time zone,
    projectid character varying COLLATE pg_catalog."default",
    creationdate timestamp without time zone,
    isimmonetportal boolean DEFAULT false,
    isimmoweltportal boolean DEFAULT false,
    isselogerportal boolean DEFAULT false,
    islogicimmoportal boolean DEFAULT false,
    numberofbedrooms numeric,
    headline_fr character varying COLLATE pg_catalog."default",
    headline_de character varying COLLATE pg_catalog."default",
    CONSTRAINT "Classified_pkey" PRIMARY KEY (classifiedid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.classified
    OWNER to main_user

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
        geolevel numeric,
		    avivgeoid character varying COLLATE pg_catalog."default" NOT NULL,
        countryid character varying COLLATE pg_catalog."default",
        regionid character varying COLLATE pg_catalog."default",
        microregionid character varying COLLATE pg_catalog."default",
        provinceid character varying COLLATE pg_catalog."default",
        municipalityid character varying COLLATE pg_catalog."default",
        boroughid character varying COLLATE pg_catalog."default",
        neighborhoodid character varying COLLATE pg_catalog."default",
        updatedate timestamp without time zone,
        municipalityname jsonb,
        neighborhoodname jsonb,
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
    c.overallspace,
    c.furnished,
    c.yearofconstruction,
    c.certificateofeligibilityneeded,
    c.locationinbuilding,
    c.features,
    c.isauthorized,
    c.isgeodatavalid,
    c.ismarketstatuseligibleforpublication,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.geolevel
            ELSE g.geolevel
        END AS geolevel,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.countryid
            ELSE g.countryid
        END AS countryid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.regionid
            ELSE g.regionid
        END AS regionid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.microregionid
            ELSE g.microregionid
        END AS microregionid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.provinceid
            ELSE g.provinceid
        END AS provinceid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.municipalityid
            ELSE g.municipalityid
        END AS municipalityid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.municipalityname
            ELSE g.municipalityname
        END AS municipalityname,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.boroughid
            ELSE g.boroughid
        END AS boroughid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.neighborhoodid
            ELSE g.neighborhoodid
        END AS neighborhoodid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.neighborhoodname
            ELSE g.neighborhoodname
        END AS neighborhoodname,
    c.projecttypes,
    c.brand,
    c.portals,
    unnest(c.portals) AS portal,
    g.avivgeoid AS geo_avivgeoid,
    c.showaddress,
    c.street,
    c.buildstate,
    c.energycertificateclass,
    c.showprice,
    c.israngeprice,
    c.classifiedbusiness,
    c.space,
    c.ssotupdatedate,
    c.projectId,
    c.creationdate
   FROM classified c
     LEFT JOIN geo_lat_lon geolatlon ON c.lat = geolatlon.lat AND c.lon = geolatlon.lon AND c.location_type::text = 'POINT'::text
     LEFT JOIN geo g ON g.avivgeoid::text = COALESCE(geolatlon.avivgeoid, c.avivgeoid)::text
  WHERE cardinality(c.portals) > 0;

ALTER TABLE public.v_classified
    OWNER TO main_user;
 
    
CREATE OR REPLACE VIEW public.v_classified_v2
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
    c.overallspace,
    c.furnished,
    c.yearofconstruction,
    c.certificateofeligibilityneeded,
    c.locationinbuilding,
    c.features,
    c.isauthorized,
    c.isgeodatavalid,
    c.ismarketstatuseligibleforpublication,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.geolevel
            ELSE g.geolevel
        END AS geolevel,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.countryid
            ELSE g.countryid
        END AS countryid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.regionid
            ELSE g.regionid
        END AS regionid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.microregionid
            ELSE g.microregionid
        END AS microregionid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.provinceid
            ELSE g.provinceid
        END AS provinceid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.municipalityid
            ELSE g.municipalityid
        END AS municipalityid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.municipalityname
            ELSE g.municipalityname
        END AS municipalityname,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.boroughid
            ELSE g.boroughid
        END AS boroughid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.neighborhoodid
            ELSE g.neighborhoodid
        END AS neighborhoodid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.neighborhoodname
            ELSE g.neighborhoodname
        END AS neighborhoodname,
    c.projecttypes,
    c.brand,
    c.portals,
    g.avivgeoid AS geo_avivgeoid,
    c.showaddress,
    c.street,
    c.buildstate,
    c.energycertificateclass,
    c.showprice,
    c.israngeprice,
    c.classifiedbusiness,
    c.space,
    c.ssotupdatedate,
    c.projectid,
    c.creationdate,
    c.isimmonetportal,
    c.isimmoweltportal,
    c.isselogerportal,
    c.islogicimmoportal,
    c.numberofbedrooms,
    c.headline_fr,
    c.headline_de
   FROM classified c
     LEFT JOIN geo_lat_lon geolatlon ON c.lat = geolatlon.lat AND c.lon = geolatlon.lon AND c.location_type::text = 'POINT'::text
     LEFT JOIN geo g ON g.avivgeoid::text = COALESCE(geolatlon.avivgeoid, c.avivgeoid)::text;

ALTER TABLE public.v_classified_v2
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
  ALTER TABLE classified ADD COLUMN IF NOT EXISTS isSaleGoodwill boolean;

CREATE OR REPLACE VIEW public.v_classified_v2
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
    c.overallspace,
    c.furnished,
    c.yearofconstruction,
    c.certificateofeligibilityneeded,
    c.locationinbuilding,
    c.features,
    c.isauthorized,
    c.isgeodatavalid,
    c.ismarketstatuseligibleforpublication,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.geolevel
            ELSE g.geolevel
        END AS geolevel,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.countryid
            ELSE g.countryid
        END AS countryid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.regionid
            ELSE g.regionid
        END AS regionid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.microregionid
            ELSE g.microregionid
        END AS microregionid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.provinceid
            ELSE g.provinceid
        END AS provinceid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.municipalityid
            ELSE g.municipalityid
        END AS municipalityid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.municipalityname
            ELSE g.municipalityname
        END AS municipalityname,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.boroughid
            ELSE g.boroughid
        END AS boroughid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.neighborhoodid
            ELSE g.neighborhoodid
        END AS neighborhoodid,
        CASE
            WHEN geolatlon.lat IS NOT NULL AND geolatlon.lon IS NOT NULL AND c.location_type::text = 'POINT'::text THEN geolatlon.neighborhoodname
            ELSE g.neighborhoodname
        END AS neighborhoodname,
    c.projecttypes,
    c.brand,
    c.portals,
    g.avivgeoid AS geo_avivgeoid,
    c.showaddress,
    c.street,
    c.buildstate,
    c.energycertificateclass,
    c.showprice,
    c.israngeprice,
    c.classifiedbusiness,
    c.space,
    c.ssotupdatedate,
    c.projectid,
    c.creationdate,
    c.isimmonetportal,
    c.isimmoweltportal,
    c.isselogerportal,
    c.islogicimmoportal,
    c.numberofbedrooms,
    c.headline_fr,
    c.headline_de,
    c.isSaleGoodwill
   FROM classified c
     LEFT JOIN geo_lat_lon geolatlon ON c.lat = geolatlon.lat AND c.lon = geolatlon.lon AND c.location_type::text = 'POINT'::text
     LEFT JOIN geo g ON g.avivgeoid::text = COALESCE(geolatlon.avivgeoid, c.avivgeoid)::text;

ALTER TABLE public.v_classified_v2
    OWNER TO main_user;
  `;

  try {
    await poolInstance.getPool().then(_pool => _pool.query(sqlDatabase)); // Ensure you are getting the pool instance correctly
    console.log('Database patched successfully');
  } catch (e) {
    logger.error('Error executing SQL:', e);
  }
};

const removeGeo = async () => {
  const sqlDatabase =  `
  delete
  from public.geo_lat_lon;
  delete
  from geo
 `;
   try {
    await poolInstance.getPool().then(_pool => _pool.query(sqlDatabase)); // Ensure you are getting the pool instance correctly
    console.log('Database cleaned successfully');
  } catch (e) {
    logger.error('Error executing SQL:', e);
  }
};

const removeOrphans = async () => {
  const sqlDatabase =  `
    delete 
    from classified 
    where portals is null or cardinality(portals)=0

 `;
   try {
    await poolInstance.getPool().then(_pool => _pool.query(sqlDatabase)); // Ensure you are getting the pool instance correctly
    console.log('Database cleaned successfully');
  } catch (e) {
    logger.error('Error executing SQL:', e);
  }
};
export { initDatabase, patchDatabase, removeGeo, removeOrphans };
