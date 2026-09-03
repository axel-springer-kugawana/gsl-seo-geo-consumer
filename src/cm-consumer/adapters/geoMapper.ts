import { GeoManagementStructure } from "@models";
import { Geo, GeoName } from "@shared/models/geo/1.0.0/geo";

export const transformGeoManagementToGeo = (geoMgmt: GeoManagementStructure): Geo => {
  const feature = geoMgmt.current_feature;

  if (!feature) {
    throw new Error('current_feature is required for transformation');
  }
  //TODO : enrich from api to get the missing fields (country, province, region, municipality, legacy mappings, etc.)


  
  // Transform names from Record<string, NameStructure[]> to GeoName[]
  const transformedNames: GeoName[] = Object.entries(feature.names).flatMap(([language, nameArray]) => nameArray.map(name => ({
    DisplayName: name.display_name,
    Language: language,
    Name: name.name,
    Slug: name.slug,
  }))
  );

  return {
    AvivGeoId: feature.id,
   
    AvailableNeighborhoods: [],
    Code: feature.administrative_code || "",
    Country: {
      AvivGeoId: "",
      Code: "",
      IsFictive: false,
      Names: [],
    },
    Type : feature.type,
    CountryCode: "",
    ImmoweltLegacyMappings: null, // Assuming you will fill this based on your data structure
    IsFictive: feature.fictive,
    Level: feature.level,
    LogicImmoLegacyMapping:  null,
    Municipality:  null,
    Names: transformedNames,
    NeighbouringGeoLevels: [],
    PostalCodes: feature.postal_codes,
    Province:  null,
    Region:  null,
    SelogerLegacyMapping:  null,
    SurroundingMunicipalitiesIds: [],
    ttl: 0,
    UpdateDate: geoMgmt.updated || geoMgmt.created || new Date().toISOString(),
  } as unknown as Geo;
};
