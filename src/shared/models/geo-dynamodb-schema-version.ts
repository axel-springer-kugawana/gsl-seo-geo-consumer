// Static sort key value ("V1" | "V2"...) written to the geo-feature and geo-lineage DynamoDB tables.
export const GEO_DYNAMODB_SCHEMA_VERSION = process.env.GEO_DYNAMODB_SCHEMA_VERSION || "V1";
