import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { logger } from "@shared/cross-cutting/logger";
import { Classified } from "@shared/models/classified/1.0.0/classified";

const ddbClient = new DynamoDBClient({});

const createOrUpdateClassified = async (id: string, data: Classified): Promise<void> => {

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
          #VERSIONATTN = :VERSIONATTCURRV
        REMOVE
          #SOFTDELETE, #EXPIREAT
         `,
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
        "#SOFTDELETE": "softdeleted",
        "#EXPIREAT": "expireat"
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


const markClassifiedAsDeleted = async (deleteCommand : { classifiedId: string, updateDate: string}): Promise<void> => {

  const { classifiedId, updateDate } = deleteCommand;

  const onDayInSeconds = 60 * 60 * 24 * 1;
  const expiryTime = Math.floor(Date.now() / 1000) + onDayInSeconds;

  const result = await ddbClient.send(new UpdateItemCommand({
    TableName: process.env.MV_TABLE_NAME,
    Key: {
      "id": {
        "S": classifiedId
      }
    },
    UpdateExpression: `
    SET 
      #EXPIREAT = :EXPIREAT,
      #VERSIONATTN = :VERSIONATTCURRV,
      #SOFTDELETE = :SOFTDELETE`,
    ConditionExpression: "attribute_not_exists(#VERSIONATTN) OR #VERSIONATTN < :VERSIONATTCURRV",
    ExpressionAttributeValues: {
      ":EXPIREAT": {
        "N": expiryTime.toString()
      },
      ":VERSIONATTCURRV": {
        "S": updateDate?.toString()
      },
      ":SOFTDELETE": {
        "BOOL": true
      },
    },
    ExpressionAttributeNames: {
      "#EXPIREAT": "expireat",
      "#VERSIONATTN": "version",
      "#SOFTDELETE": "softdeleted"
    }
  }));

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error deleting item of id: ${classifiedId}`, {
      cause: result.$metadata
    });
  }


}



export {
  createOrUpdateClassified,
  markClassifiedAsDeleted
}