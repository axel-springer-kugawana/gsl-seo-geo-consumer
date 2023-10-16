import { ListObjectsV2Command, S3, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3();

const client = new S3Client({});


const getDataByKey = async <T>(key: string): Promise<T> => {

    // TODO: proper error handling

    const data = await s3Client.getObject({
        Key: key,
        Bucket: process.env.CLASSIFIEDS_BUCKET_NAME
    });

    const json = await data.Body.transformToString("utf-8")

    return JSON.parse(json) as T

}


const listObjects = async (prefix: string): Promise<string[]> => {

    const command = new ListObjectsV2Command({
        Bucket: process.env.CLASSIFIEDS_BUCKET_NAME,
        Prefix: prefix
    });

    try {
        let isTruncated = true;

        const content = [];

        while (isTruncated) {
            const { Contents, IsTruncated, NextContinuationToken } =
                await client.send(command);
            
            content.push(...Contents.filter(c => c.Key.endsWith("/") === false).map(c => c.Key));

            isTruncated = IsTruncated;
            command.input.ContinuationToken = NextContinuationToken;
        }


        return content;

    } catch (err) {
        console.error(err);
    }

}




export {
    getDataByKey,
    listObjects
}


