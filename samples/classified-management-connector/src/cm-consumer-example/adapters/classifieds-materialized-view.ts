import { DeleteItemCommand, DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { logger } from "@shared/cross-cutting/logger";
import { Classified } from "@shared/models/classified/1.0.0/classified";

const ddbClient = new DynamoDBClient({});

const putItem = async (id: string, data: Classified): Promise<void> => {

  try {
    await ddbClient.send(new UpdateItemCommand({
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
          "S": data.metadata.updateDate?.toString()
        },
      },
      ExpressionAttributeNames: {
        "#DATAATTN": "data",
        "#VERSIONATTN": "version",
      }
    }));

  } catch (e) {

    if(e.name === "ConditionalCheckFailedException") {
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: data
      })
    } else {
      throw e;
      
    }

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
    throw new Error(`Error deleting item of id: ${id}`, {
      cause: result.$metadata
    });
  }


}



export {
  putItem,
  deleteItem
}