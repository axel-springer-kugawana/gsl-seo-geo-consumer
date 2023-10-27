import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "@ssot-connector/config/configuration-provider";

const s3Client = new S3Client({});

const getSSOTItem = async <TSSOTData>(key: string) => {

    
    const data = await s3Client.send(new GetObjectCommand({
        Key: key,
        Bucket: config.get("ssotBucketName")
    }));

    if(data.$metadata.httpStatusCode !== 200) {
        // log error
        return;
    }

    const content = await data.Body.transformToString('utf-8');

    return JSON.parse(content) as TSSOTData;


}



export {
    getSSOTItem
}