import { getDataByKey } from "data-feeder/adapters/s3-object-data-reader";

export const handler = async (event: { Items: Item[] }) => {

    await Promise.all(event.Items.map(async item => {
        console.log({ key: item.Key })
        const data = await getDataByKey(item.Key);
        console.log(JSON.stringify(data))
    }));

};


export interface Item {
    Etag: string;
    Key: string;
    LastModified: number;
    Size: number;
    StorageClass: string;
}