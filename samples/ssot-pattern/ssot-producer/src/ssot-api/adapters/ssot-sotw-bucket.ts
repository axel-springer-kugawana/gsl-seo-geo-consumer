import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { logger } from "@shared/cross-cutting/logger";
import { generateS3bucketForActiveObjectKey_V0, generateS3bucketForDeletedObjectKey_V0 } from "./ssot-bucket-object-layout-v0";
import { config } from "ssot-api/config/configuration-provider";
import { SsotEntity } from "@shared/models/ssot-entity/models";

const s3Client = new S3Client({});

const putSSoTEntity = async (entity: SsotEntity) => {

    const { id, metadata: { partition, dataModelVersion}} = entity; 

    const command = new PutObjectCommand({
        Key: generateS3bucketForActiveObjectKey_V0({ partition, dataVersion: dataModelVersion, identifier: id }),
        Bucket: config.get("ssotBucketName"),
        Body: JSON.stringify(entity)
    });

    const result = await s3Client.send(command);

    if (result.$metadata.httpStatusCode !== 200) {
        logger.error("Error occured when writing SSOT item into the bucket", {
            putCommandResultMetadata: result.$metadata
        });

        throw new Error(`Writing ssot item ${config.get("ssotBucketName")} into the bucket Failed`);
    } 

    // houskeeping the deleted items (remove a deleted key if any is present with the caracteristics of the ssot item to create/update) 
    const objectToHouseKeep = generateS3bucketForDeletedObjectKey_V0({ partition, dataVersion: dataModelVersion, identifier: id });
    const res = await s3Client.send(new DeleteObjectCommand({
        Bucket: config.get("ssotBucketName"),
        Key: objectToHouseKeep
    }));

    console.log({res})

}


const deleteSSoTEntity = async (entity: SsotEntity) => {

    const { id, metadata: { partition, dataModelVersion}} = entity; 

    const active = generateS3bucketForActiveObjectKey_V0({ partition, dataVersion: dataModelVersion, identifier: id });
    const deleted = generateS3bucketForDeletedObjectKey_V0({ partition, dataVersion: dataModelVersion, identifier: id });

    await s3Client.send(new PutObjectCommand({
        Bucket: config.get("ssotBucketName"),
        Key: deleted,
        Body: JSON.stringify(entity)
    }));

    await s3Client.send(new DeleteObjectCommand({
        Bucket: config.get("ssotBucketName"),
        Key: active
    }));

}


export {
    putSSoTEntity,
    deleteSSoTEntity
}