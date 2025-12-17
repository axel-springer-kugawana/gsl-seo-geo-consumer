import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { logger } from "@shared/cross-cutting/logger";
import { Classified } from "@shared/models/classified/1.0.0/classified";
import { ClassifiedWithFullGeo } from "@shared/models/classified/1.0.0/ClassifiedWithFullGeo";

// Configuration du client DynamoDB avec SSO pour le développement local
const isLocal = process.env.AWS_EXECUTION_ENV === undefined;

const ddbClient = new DynamoDBClient(
  isLocal
    ? {
        region: process.env.AWS_REGION || 'eu-central-1',
        credentials: fromSSO({
          profile: 'AvivPowerUserAccessReadWrite-135557783010',
        }),
      }
    : {}
);

const createOrUpdateClassified = async (id: string, data: Classified, classified: ClassifiedWithFullGeo): Promise<void> => {

  try {
    await ddbClient.send(new UpdateItemCommand({
      TableName: isLocal ? "seo-ssot-classified-v2" : process.env.MV_TABLE_NAME,
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
      ConditionExpression: "attribute_not_exists(#VERSIONATTN) OR #VERSIONATTN <= :VERSIONATTCURRV",
      ExpressionAttributeValues: {
        ":DATAATTV": {
          "S": JSON.stringify(classified)
        },
        ":VERSIONATTCURRV": {
          "S": data?.metadata?.updateDate?.toString()??Date.now.toString()
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

    if (e.name === "ConditionalCheckFailedException") {
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: data
      })
      logger.warn(e)
    } else {


      logger.warn("Error While update / creating DynamoDB Record", {
        classified: id
      })

      let tmp = JSON.stringify(classified);
      logger.warn(e)
      logger.warn("dynamodb Payload : "+tmp);
      
      logger.warn("Error : "+ e?.name);
      
      logger.warn("data.metadata.updateDate? : "+ data?.metadata?.updateDate);
      throw e;
    }
  }
}


const markClassifiedAsDeleted = async (deleteCommand: { classifiedId: string, updateDate: string }): Promise<void> => {

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