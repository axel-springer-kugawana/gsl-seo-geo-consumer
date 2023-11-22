import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";


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
        #DATAATTN = :DATAATTV`,
    ExpressionAttributeValues: {
      ":DATAATTV": {
        "S": JSON.stringify(data)
      }
    },
    ExpressionAttributeNames: {
      "#DATAATTN": "data"
    }
  }));

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error creating item of id: ${id}`, {
      cause: result.$metadata
    });
  }


}



export {
  putItem
}