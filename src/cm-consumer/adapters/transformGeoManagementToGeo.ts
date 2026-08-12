import { GeoManagementStructure } from "@models";
import { Geo, GeoName } from "@shared/models/geo/1.0.0/geo";

export const transformGeoManagementToGeo = (geoMgmt: GeoManagementStructure): Geo => {
  const feature = geoMgmt.current_feature;

  if (!feature) {
    throw new Error('current_feature is required for transformation');
  }

  // Transform names from Record<string, NameStructure[]> to GeoName[]
  const transformedNames: GeoName[] = Object.entries(feature.names).flatMap(([language, nameArray]) => nameArray.map(name => ({
    DisplayName: name.display_name,
    Language: language,
    Name: name.name,
    Slug: name.slug,
  }))
  );

  // Extract legacy mappings
  const immoweltMappings = feature.mapping.immowelt_geoids || [];
  const logicImmoMapping = feature.mapping.logicimmo?.[0] || null;
  const selogerMapping = feature.mapping.atlas?.[0] || null;

  return {
    AvivGeoId: feature.id,
    Version: "1.0.0",
    AvailableNeighborhoods: [],
    Code: feature.administrative_code || "",
    Country: {
      AvivGeoId: "",
      Code: "",
      IsFictive: false,
      Names: [],
    },
    CountryCode: "",
    ImmoweltLegacyMappings: immoweltMappings,
    IsFictive: feature.fictive,
    Level: feature.level,
    LogicImmoLegacyMapping: logicImmoMapping ? {
      AvivGeoId: logicImmoMapping.id,
      Code: "",
      Parents: [],
      SecondarySlug: "",
      Slug: "",
    } : null,
    Municipality: {
      AvivGeoId: "",
      IsFictive: false,
      Names: [],
    },
    Names: transformedNames,
    NeighbouringGeoLevels: [],
    PostalCodes: feature.postal_codes,
    Province: {
      AvivGeoId: "",
      IsFictive: false,
      Names: [],
    },
    Region: {
      AvivGeoId: "",
      IsFictive: false,
      Names: [],
    },
    SelogerLegacyMapping: selogerMapping ? {
      AvivGeoId: selogerMapping.id,
      Code: selogerMapping.metadata?.source_id,
      Slug: "",
      Parents: [],
    } : null,
    SurroundingMunicipalitiesIds: [],
    ttl: 0,
    UpdateDate: geoMgmt.updated || geoMgmt.created || new Date().toISOString(),
  } as Geo;
};
