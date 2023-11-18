import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
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



async function* listKeys (prefix: string, nextContinuationToken: string) {


    const command = new ListObjectsV2Command({
        Bucket: config.get("ssotBucketName"),
        Prefix: prefix,
        ContinuationToken: nextContinuationToken ? nextContinuationToken : null
    });

    try {
        let isTruncated = true;

        const content = [];

        while (isTruncated) {
            const { Contents, IsTruncated, NextContinuationToken } =
                await s3Client.send(command);

            isTruncated = IsTruncated;
            command.input.ContinuationToken = NextContinuationToken;

            yield {
                keys: Contents.filter(c => c.Key.endsWith("/") === false).map(c => c.Key),
                nextContinuationToken: NextContinuationToken
            }
        }


        return content;

    } catch (err) {
        console.error(err);
    }

}




export {
    getSSOTItem,
    listKeys
}