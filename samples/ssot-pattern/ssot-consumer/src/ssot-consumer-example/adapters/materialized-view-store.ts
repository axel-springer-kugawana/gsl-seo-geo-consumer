import { DeleteItemCommand, DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const ddbClient = new DynamoDBClient({});

const putItem = async (id: string, data: any): Promise<void> => {

  const result = await ddbClient.send(new UpdateItemCommand({
    TableName: process.env.MV_TABLE_NAME,
    Key: {
      "id": {
        "S": id
      }
    },
    UpdateExpression: `
      SET 
        #DATAATTN = :DATAATTV,
        #VERSIONATTN = :VERSIONATTCURRV`,
    ConditionExpression: "attribute_not_exists(#VERSIONATTN) OR #VERSIONATTN < :VERSIONATTCURRV",
    ExpressionAttributeValues: {
      ":DATAATTV": {
        "S": JSON.stringify(data)
      },
      ":VERSIONATTCURRV": {
        "N": data.metadata.objectVersion?.toString()
      },
    },
    ExpressionAttributeNames: {
      "#DATAATTN": "data",
      "#VERSIONATTN": "version",
    }
  }));

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error creating item of id: ${id}`, {
      cause: result.$metadata
    });
  }


}



const deleteItem = async (id: string): Promise<void> => {

  const result = await ddbClient.send(new DeleteItemCommand({
    TableName: process.env.MV_TABLE_NAME,
    Key: {
      "id": {
        "S": id
      }
    }
   
  }));

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error creating item of id: ${id}`, {
      cause: result.$metadata
    });
  }


}



export {
  putItem,
  deleteItem
}