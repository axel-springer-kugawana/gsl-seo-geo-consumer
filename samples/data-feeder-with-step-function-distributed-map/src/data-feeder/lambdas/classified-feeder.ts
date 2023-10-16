import { getDataByKey } from "data-feeder/adapters/s3-object-data-reader";

export const handler = async (event: { Items: string[] }) => {

    await Promise.all(event.Items.map(async item => {
        const data = await getDataByKey(item);
        console.log(JSON.stringify(data))
    }));

};


