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
  Macroregion: GeoEntityBase;
  AvivGeoId: string;
  Version: string;
  AvailableNeighborhoods: string[];
  Code: string;
  Country: GeoEntityBase;
  CountryCode: string;
  ImmoweltLegacyMappings: ImmoweltLegacyMapping[];
  IsFictive: boolean;
  Level?: number;
  LogicImmoLegacyMapping: LogicImmoLegacyMapping;
  Municipality: GeoEntityBase;
  Names: GeoName[];
  NeighbouringGeoLevels: string[];
  PostalCodes: string[];
  Province: GeoEntityBase;
  Region: GeoEntityBase;
  SelogerLegacyMapping: SelogerLegacyMapping;
  SurroundingMunicipalitiesIds: string[];
  ttl: number;
  UpdateDate: string;
}