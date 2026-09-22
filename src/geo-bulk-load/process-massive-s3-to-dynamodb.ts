import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { createDynamoDBClient, DYNAMODB_BATCH_WRITE_LIMIT, sendBatchToDynamoDB } from "@shared/adapters/dynamodb-client";
import { requireEnvironmentVariable } from "@shared/cross-cutting/environment";
import { logger } from "@shared/cross-cutting/logger";
import { parse } from 'csv-parse';

const awsRegion = requireEnvironmentVariable('AWS_REGION');
const ddbClient = createDynamoDBClient(awsRegion);
const s3Client = new S3Client({ region: awsRegion });

interface CsvRowDto {
    url_legacy: string;
    geo_level: string;
    url_new: string;
    match_type: string;
}

interface GeoLegacyMappingDto {
    LegacyGeoId: string;
    Brand: string;
    GeoLevel: string;
    AvivGeoId: string;
    MatchType: string;
}

export async function importLegacyMappingFallbacksToDynamoDB(): Promise<void> {

    const fileKey = "Pricemap.csv";
    const bucketName = requireEnvironmentVariable('GEO_LEGACY_MAPPING_BUCKET_NAME');
    const tableName = requireEnvironmentVariable('GEO_LEGACY_MAPPING_DYNAMODB_TABLE_NAME');

    // 1. Récupération du fichier CSV depuis S3
    const s3Response = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
    }));

    if (!s3Response.Body) {
        throw new Error("Le corps de la réponse S3 est vide.");
    }

    // Convertir le flux S3 en stream Readable pour csv-parse
    const s3Stream = s3Response.Body as Readable;

    const csvParser = s3Stream.pipe(parse({
        delimiter: ';',
        columns: true,
        skip_empty_lines: true,

        trim: true,
    }));

    let batch: GeoLegacyMappingDto[] = [];
    let totalProcessed = 0;

    for await (const record of csvParser) {
        const row: CsvRowDto = record;

        batch.push({
            LegacyGeoId: row.url_legacy,
            Brand: "PriceMap",
            GeoLevel: row.geo_level,
            AvivGeoId: row.url_new,
            MatchType: row.match_type,
        });

        if (batch.length === DYNAMODB_BATCH_WRITE_LIMIT) {
            await sendBatchToDynamoDB(ddbClient, tableName, batch);
            totalProcessed += batch.length;
            batch = [];
        }
    }

    // Envoyer les éléments restants qui n'ont pas rempli un lot complet
    if (batch.length > 0) {
        await sendBatchToDynamoDB(ddbClient, tableName, batch);
        totalProcessed += batch.length;
    }

    logger.info(`Total processed: ${totalProcessed}`);
}