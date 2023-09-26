import { S3 } from "@aws-sdk/client-s3";

const s3Client = new S3();

const getDataByKey = async <T>(key: string): Promise<T> => {

    // TODO: proper error handling
    
    const data = await s3Client.getObject({
        Key: key,
        Bucket: process.env.CLASSIFIEDS_BUCKET_NAME
    });

    const json = await data.Body.transformToString("utf-8")

    return JSON.parse(json) as T

}





export {
    getDataByKey
}


