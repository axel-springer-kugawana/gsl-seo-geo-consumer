import { z } from 'zod'

export const coordinatesStructure = z.object({
  lat: z.number(),
  lng: z.number(),
})

export const coordinatesDetailedStructure = z.object({
  lat: z.number(),
  lng: z.number(),
  centroid: coordinatesStructure,
  point_on_surface: coordinatesStructure,
  max_inscribed_circle: coordinatesStructure,
})

export const viewportStructure = z.object({
  ne: coordinatesStructure,
  sw: coordinatesStructure,
})

export const nameStructure = z.object({
  name: z.string(),
  display_name: z.string(),
  slug: z.string(),
  name_rank: z.number(),
  name_root: z.string(),
  name_prefix: z.string().nullable(),
  name_prepositions: z.object({
    de: z.string(),
    à: z.string(),
  }),
})

export const mappingMetricStructure = z.object({
  confidence: z.number(),
  testname: z.string(),
})

export const atlasMappingStructure = z.object({
  metric: mappingMetricStructure,
  id: z.string(),
  type: z.string(),
  metadata: z.object({
    version: z.string(),
    source_id: z.string(),
    source_name: z.string(),
  }),
})

export const logicimmoMappingStructure = z.object({
  metric: mappingMetricStructure,
  id: z.string(),
  type: z.string(),
})

export const meilleursagentsMappingStructure = z.object({
  metric: mappingMetricStructure,
  id: z.number(),
  type: z.string(),
  platform: z.string(),
})

export const mappingStructure = z.object({
  atlas: z.optional(z.array(atlasMappingStructure).nullable()),
  places: z.optional(z.any().nullable()),
  immoweb: z.optional(z.any().nullable()),
  immowelt: z.optional(z.any().nullable()),
  logicimmo: z.optional(z.array(logicimmoMappingStructure).nullable()),
  meilleursagents: z.optional(z.array(meilleursagentsMappingStructure).nullable()),
  iso3166: z.optional(z.any().nullable()),
  immowelt_geoids: z.optional(z.any().nullable()),
})

export const currentFeatureStructure = z.object({
  id: z.string(),
  type: z.string(),
  type_key: z.string(),
  level: z.number(),
  active: z.boolean(),
  fictive: z.boolean(),
  language: z.string(),
  names: z.record(z.string(), z.array(nameStructure)),
  administrative_code: z.string().nullable(),
  main_postal_code: z.string().nullable(),
  postal_codes: z.array(z.string()),
  area: z.number(),
  coordinates: coordinatesDetailedStructure,
  viewport: viewportStructure,
  bounding_box: viewportStructure,
  weight: z.number(),
  mapping: mappingStructure,
  lineage: z.optional(z.any().nullable()),
  duplicates: z.optional(z.any().nullable()),
  extra_properties: z.optional(z.any().nullable()),
  subtype: z.optional(z.string().nullable()),
  active_since: z.string(),
  deprecated_since: z.optional(z.string().nullable()),
  parents: z.optional(z.any().nullable()),
})

export const deletedFallbackStructure = z.object({
  //type: z.string(),
  ancestor_id: z.string(),
  descendant_id: z.string(),
})

export const deletedStructure = z.object({
  fallback: z.array(deletedFallbackStructure),
})

export const geoManagementStructure = z.object({
  id: z.string(),
  type: z.string(), // CREATED, UPDATED, DELETED
  current_feature: z.optional(currentFeatureStructure.nullable()),
  platform: z.string(),
  release_date: z.string(),
  created: z.optional(z.string().nullable()),
  updated: z.optional(z.string().nullable()),
  deleted: z.optional(deletedStructure.nullable()),
})

export type CoordinatesStructure = z.infer<typeof coordinatesStructure>
export type CoordinatesDetailedStructure = z.infer<typeof coordinatesDetailedStructure>
export type ViewportStructure = z.infer<typeof viewportStructure>
export type NameStructure = z.infer<typeof nameStructure>
export type MappingMetricStructure = z.infer<typeof mappingMetricStructure>
export type AtlasMappingStructure = z.infer<typeof atlasMappingStructure>
export type LogicimmoMappingStructure = z.infer<typeof logicimmoMappingStructure>
export type MeilleursagentsMappingStructure = z.infer<typeof meilleursagentsMappingStructure>
export type MappingStructure = z.infer<typeof mappingStructure>
export type CurrentFeatureStructure = z.infer<typeof currentFeatureStructure>
export type DeletedFallbackStructure = z.infer<typeof deletedFallbackStructure>
export type DeletedStructure = z.infer<typeof deletedStructure>
export type GeoManagementStructure = z.infer<typeof geoManagementStructure>
