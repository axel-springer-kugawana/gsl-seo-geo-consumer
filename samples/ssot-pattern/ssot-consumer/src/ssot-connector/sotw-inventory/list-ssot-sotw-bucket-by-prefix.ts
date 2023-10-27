import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const client = new S3Client({});

const listObjects = async (sourceBucket: string, prefix: string) => {

    const command = new ListObjectsV2Command({
        Bucket: sourceBucket,
        Prefix: prefix
    });

    try {
        let isTruncated = true;
        let numberOfProcessedItems = 0;

        const content = [];

        while (isTruncated) {
            const { Contents, IsTruncated, NextContinuationToken } =
                await client.send(command);
            
            numberOfProcessedItems += Contents.length;
            content.push(...Contents.filter(c => c.Key.endsWith("/") === false).map(c => c.Key));

            isTruncated = IsTruncated;
            command.input.ContinuationToken = NextContinuationToken;

            console.log(numberOfProcessedItems);
        }


        return content;

    } catch (err) {
        console.error(err);
    }

}


const writeFileList = async (listBucket: string, content: string[], outputFile: string) => {
    const command = new PutObjectCommand({
        Bucket: listBucket,
        Key: outputFile,
        Body: JSON.stringify(content)
    });

    try {
        await client.send(command);
    } catch (err) {
        console.error(err);
    }
}


(async () => {

    console.log(JSON.stringify({
        "message": "listing objects",
        "from": process.env.SOURCE_BUCKET,
        "prefix": process.env.PREFIX,
        "to": process.env.LIST_BUCKET,
        "outputfile": process.env.OUTPUT_FILE
    }))

    const content = await listObjects(
        process.env.SOURCE_BUCKET, 
        process.env.PREFIX);

    await writeFileList(
        process.env.LIST_BUCKET, 
        content,
        process.env.OUTPUT_FILE);
})();