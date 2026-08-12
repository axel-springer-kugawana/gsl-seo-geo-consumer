// Aviv Geo API Models

export interface GeoName {
  DisplayName: string;
  Language: string;
  Name: string;
  Slug: string;
}

export interface GeoParent {
  AvivGeoId: string;
  Code?: string;
  Slug: string;
  SecondarySlug?: string;
}

export interface GeoEntityBase {
  AvivGeoId: string;
  Code?: string;
  IsFictive: boolean;
  Names: GeoName[];
}

export interface Country extends GeoEntityBase {}

export interface Municipality extends GeoEntityBase {}

export interface Province extends GeoEntityBase {}

export interface Region extends GeoEntityBase {}

export interface ImmoweltLegacyMapping {
  Id: string;
}

export interface LogicImmoLegacyMapping {
  AvivGeoId: string;
  Code: string;
  Parents: GeoParent[];
  SecondarySlug: string;
  Slug: string;
}

export interface SelogerLegacyMapping {
  AvivGeoId: string;
  Code?: string;
  Slug: string;
  Parents?: GeoParent[];
}

export interface Geo {
  AvivGeoId: string;
  Version: string;
  AvailableNeighborhoods: string[];
  Code: string;
  Country: Country;
  CountryCode: string;
  ImmoweltLegacyMappings: ImmoweltLegacyMapping[];
  IsFictive: boolean;
  Level: number;
  LogicImmoLegacyMapping: LogicImmoLegacyMapping;
  Municipality: Municipality;
  Names: GeoName[];
  NeighbouringGeoLevels: string[];
  PostalCodes: string[];
  Province: Province;
  Region: Region;
  SelogerLegacyMapping: SelogerLegacyMapping;
  SurroundingMunicipalitiesIds: string[];
  ttl: number;
  UpdateDate: string;
}