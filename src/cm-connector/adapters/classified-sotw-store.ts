import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { config } from "@cm-connector/config/configuration-provider";
import { logger } from "@shared/cross-cutting/logger";
// import { Classified } from "@shared/models/classified/1.0.0/classified";

const s3Client = new S3Client({});

async function* listKeys(prefix: string, nextContinuationToken: string) {
    let isTruncated = false;
    let continuationToken = nextContinuationToken;

    try {
        do {
            logger.info("Listing keys from bucket 1", {
                prefix,
                continuationToken,
            });

            const listCommand = new ListObjectsV2Command({
                Bucket: config.get("ssotBucketName"),
                Prefix: prefix,
                ContinuationToken: continuationToken ? continuationToken : undefined,
            });

            logger.info("Listing keys from bucket 2", {
                listCommand:listCommand
            });

            const { Contents, IsTruncated, NextContinuationToken } = await s3Client.send(listCommand);


            logger.info("Listing keys from bucket 3 ", {
                IsTruncated,
                NextContinuationToken,
                Contents: Contents?.map((c) => c.Key),
            });
            
            isTruncated = IsTruncated == true;
            continuationToken = NextContinuationToken!;

            yield {
                keys: (Contents ?? []).filter((c) => c.Key!.endsWith("/") === false).map((c) => c.Key!),
                nextContinuationToken: NextContinuationToken!,
            };
        } while (isTruncated);
    } catch (error) {
        logger.error("Error occured while getting bucket keys", {
            error,
        });
    }
}

// export { getClassifiedByKey, listKeys };

export { listKeys };