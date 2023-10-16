const {
    S3Client, PutObjectCommand, ListObjectsV2Command
}= require("@aws-sdk/client-s3");


const config = {
    "from": process.env.SOURCE_BUCKET,
    "prefix": process.env.PREFIX,
    "to": process.env.LIST_BUCKET,
    "jobId": process.env.JOB_ID
}


const client = new S3Client({});

const listObjects = async (sourceBucket, prefix) => {

    const command = new ListObjectsV2Command({
        Bucket: sourceBucket,
        Prefix: prefix
    });

    try {
        let isTruncated = true;
        numberOfProcessedItems = 0;

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


const writeFileList = async (listBucket, content, jobId) => {
    const command = new PutObjectCommand({
        Bucket: listBucket,
        Key: `filelist-${jobId}.json`,
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
        "to": process.env.LIST_BUCKET
    }))

    const content = await listObjects(
        process.env.SOURCE_BUCKET, 
        process.env.PREFIX);

    await writeFileList(
        process.env.LIST_BUCKET, 
        content,
        "42");
})();