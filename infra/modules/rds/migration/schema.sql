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
    lat numeric,
    lon numeric,
    CONSTRAINT "Classified_pkey" PRIMARY KEY (classifiedid)
)
TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.classified
    OWNER to main_user;
    
    -- Table: public.geo
-- Table: public.geo
-- DROP TABLE IF EXISTS public.geo;
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
    CONSTRAINT pk_geo PRIMARY KEY (avivgeoid)
)
TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.geo
    OWNER to main_user;
    
    
-- Table: public.geo_lat_lon
-- DROP TABLE IF EXISTS public.geo_lat_lon;
CREATE TABLE IF NOT EXISTS public.geo_lat_lon
(
    lon numeric NOT NULL,
    lat numeric NOT NULL,
    avivgeoid character varying COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT pk_lat_lon PRIMARY KEY (lat, lon)
)
TABLESPACE pg_default;
ALTER TABLE IF EXISTS public.geo_lat_lon
    OWNER to main_user;
-- View: public.v_immonet
-- DROP VIEW public.v_immonet;
CREATE OR REPLACE VIEW public.v_immonet
 AS
 SELECT c.classifiedid,
    c.estatetype,
    c.estatesubtype,
    c.distributiontype,
    c.avivgeoid,
    c.country,
    c.postalcode,
    c.price,
    c.numberofrooms,
    c.furnished,
    c.yearofconstruction,
    c.certificateofeligibilityneeded,
    c.locationinbuilding,
    c.features,
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
  WHERE c.brand::text = 'IWT'::text AND ('IMMONET'::text = ANY (c.portals));
ALTER TABLE public.v_immonet
    OWNER TO main_user;
