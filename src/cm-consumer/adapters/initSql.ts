import { poolInstance } from "./connectPostGre";
import { logger } from "@shared/cross-cutting/logger";

const initDatabase = async () => {
  const sqlDatabase = `
    DROP VIEW IF EXISTS v_classified_v2;
    DROP TABLE IF EXISTS classified;
    DROP TABLE IF EXISTS geo;
    DROP TABLE IF EXISTS geo_lat_lon;

    -- Table: public.classified_v2

-- DROP TABLE IF EXISTS public.classified_v2;

CREATE TABLE IF NOT EXISTS public.classified_v2
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
    isselogerportal boolean DEFAULT false,
    islogicimmoportal boolean DEFAULT false,
    numberofbedrooms numeric,
    headline_fr character varying COLLATE pg_catalog."default",
    issalegoodwill boolean,
    businesssubtype character varying COLLATE pg_catalog."default",
    building_offeredfloors numeric,
    hideneighborhood boolean DEFAULT false,
    geoprecision character varying COLLATE pg_catalog."default",
    placeids text[] COLLATE pg_catalog."default",
    place_ad02 text[] COLLATE pg_catalog."default",
    place_ad03 text[] COLLATE pg_catalog."default",
    place_ad04 text[] COLLATE pg_catalog."default",
    place_ad05 text[] COLLATE pg_catalog."default",
    place_ad06 text[] COLLATE pg_catalog."default",
    place_ad08 text[] COLLATE pg_catalog."default",
    place_ad09 text[] COLLATE pg_catalog."default",
    place_nbh1 text[] COLLATE pg_catalog."default",
    place_nbh2 text[] COLLATE pg_catalog."default",
    place_nbh3 text[] COLLATE pg_catalog."default",
    place_stu3 text[] COLLATE pg_catalog."default",
    place_bloc text[] COLLATE pg_catalog."default",
    place_strt text[] COLLATE pg_catalog."default",
    place_honu text[] COLLATE pg_catalog."default",
    CONSTRAINT "Classified_v2_pkey" PRIMARY KEY (classifiedid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.classified_v2
    OWNER to main_user;
-- Index: idx_classified_fullevent_portals_v2

-- DROP INDEX IF EXISTS public.idx_classified_fullevent_portals_v2;

CREATE INDEX IF NOT EXISTS idx_classified_fullevent_portals_v2
    ON public.classified_v2 USING btree
    (portals COLLATE pg_catalog."default" ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
-- Index: idx_classified_portals_v2

-- DROP INDEX IF EXISTS public.idx_classified_portals_v2;

CREATE INDEX IF NOT EXISTS idx_classified_portals_v2
    ON public.classified_v2 USING btree
    (portals COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_v_classified_fullevent_projecttypes_gin_v2

-- DROP INDEX IF EXISTS public.idx_v_classified_fullevent_projecttypes_gin_v2;

CREATE INDEX IF NOT EXISTS idx_v_classified_fullevent_projecttypes_gin_v2
    ON public.classified_v2 USING gin
    (projecttypes COLLATE pg_catalog."default")
    WITH (fastupdate=True, gin_pending_list_limit=4194304)
    TABLESPACE pg_default;
-- Index: idx_v_classified_v2_projecttypes_gin_v2

-- DROP INDEX IF EXISTS public.idx_v_classified_v2_projecttypes_gin_v2;

CREATE INDEX IF NOT EXISTS idx_v_classified_v2_projecttypes_gin_v2
    ON public.classified_v2 USING gin
    (projecttypes COLLATE pg_catalog."default")
    TABLESPACE pg_default;

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
   -- Table: public.classified_v2

-- DROP TABLE IF EXISTS public.classified_v2;

CREATE TABLE IF NOT EXISTS public.classified_v2
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
    isselogerportal boolean DEFAULT false,
    islogicimmoportal boolean DEFAULT false,
    numberofbedrooms numeric,
    headline_fr character varying COLLATE pg_catalog."default",
    issalegoodwill boolean,
    businesssubtype character varying COLLATE pg_catalog."default",
    building_offeredfloors numeric,
    hideneighborhood boolean DEFAULT false,
    geoprecision character varying COLLATE pg_catalog."default",
    placeids text[] COLLATE pg_catalog."default",
    place_ad02 text[] COLLATE pg_catalog."default",
    place_ad03 text[] COLLATE pg_catalog."default",
    place_ad04 text[] COLLATE pg_catalog."default",
    place_ad05 text[] COLLATE pg_catalog."default",
    place_ad06 text[] COLLATE pg_catalog."default",
    place_ad08 text[] COLLATE pg_catalog."default",
    place_ad09 text[] COLLATE pg_catalog."default",
    place_nbh1 text[] COLLATE pg_catalog."default",
    place_nbh2 text[] COLLATE pg_catalog."default",
    place_nbh3 text[] COLLATE pg_catalog."default",
    place_stu3 text[] COLLATE pg_catalog."default",
    place_bloc text[] COLLATE pg_catalog."default",
    place_strt text[] COLLATE pg_catalog."default",
    place_honu text[] COLLATE pg_catalog."default",
    CONSTRAINT "Classified_v2_pkey" PRIMARY KEY (classifiedid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.classified_v2
    OWNER to main_user;
-- Index: idx_classified_fullevent_portals_v2

-- DROP INDEX IF EXISTS public.idx_classified_fullevent_portals_v2;

CREATE INDEX IF NOT EXISTS idx_classified_fullevent_portals_v2
    ON public.classified_v2 USING btree
    (portals COLLATE pg_catalog."default" ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
-- Index: idx_classified_portals_v2

-- DROP INDEX IF EXISTS public.idx_classified_portals_v2;

CREATE INDEX IF NOT EXISTS idx_classified_portals_v2
    ON public.classified_v2 USING btree
    (portals COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_v_classified_fullevent_projecttypes_gin_v2

-- DROP INDEX IF EXISTS public.idx_v_classified_fullevent_projecttypes_gin_v2;

CREATE INDEX IF NOT EXISTS idx_v_classified_fullevent_projecttypes_gin_v2
    ON public.classified_v2 USING gin
    (projecttypes COLLATE pg_catalog."default")
    WITH (fastupdate=True, gin_pending_list_limit=4194304)
    TABLESPACE pg_default;
-- Index: idx_v_classified_v2_projecttypes_gin_v2

-- DROP INDEX IF EXISTS public.idx_v_classified_v2_projecttypes_gin_v2;

CREATE INDEX IF NOT EXISTS idx_v_classified_v2_projecttypes_gin_v2
    ON public.classified_v2 USING gin
    (projecttypes COLLATE pg_catalog."default")
    TABLESPACE pg_default;
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


const removeIWT = async () => {
  const sqlDatabase =  `
 delete 
FROM public.classified
where brand ='IWT'
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
export { initDatabase, patchDatabase, removeGeo, removeIWT, removeOrphans };
