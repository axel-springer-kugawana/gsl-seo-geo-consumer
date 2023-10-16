import { writeFileList } from "data-feeder/adapters/s3-file-list-writer";
import { listObjects } from "data-feeder/adapters/s3-object-data-reader";

export const handler = async () => {

  const content = await listObjects("users2/");

  await writeFileList(content);

  return {
    statusCode: 200
  }



};


