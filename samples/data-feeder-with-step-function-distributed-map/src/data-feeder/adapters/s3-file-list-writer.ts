import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({});

const writeFileList = async (content: string[]): Promise<void> => {
    const command = new PutObjectCommand({
        Bucket: process.env.FILE_LIST_BUCKET,
        Key: "filelist.json",
        Body: JSON.stringify(content)
    });

    try {
        await client.send(command);
    } catch (err) {
        console.error(err);
    }
}

export {
    writeFileList
}


