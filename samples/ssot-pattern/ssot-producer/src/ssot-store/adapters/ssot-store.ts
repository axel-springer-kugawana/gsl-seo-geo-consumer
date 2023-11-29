import { DeleteItemCommand, DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SsotEntity } from "@shared/models/ssot-entity/models";
import { config } from "ssot-store/config/configuration-provider";

const ddbClient = new DynamoDBClient({});


const addLastUpdateDateToMetadata = (entity: SsotEntity) => {
  return {
    ...entity,
    metadata: {
      ...entity.metadata,
      lastUpdateDate: new Date().toISOString()
    }
  }
}

const createSSoTEntity = async (entity: SsotEntity): Promise<SsotEntity> => {

  const entityWithLastUpdateDate = addLastUpdateDateToMetadata(entity);
  entityWithLastUpdateDate.metadata.objectVersion = 1;

  const result = await ddbClient.send(new UpdateItemCommand({
    TableName: config.get("ssotTable"),
    Key: {
      "id": {
        "S": entityWithLastUpdateDate.id
      }
    },
    UpdateExpression: `
      SET 
        #DATAATTN = :DATAATTV, 
        #VERSIONATTN = if_not_exists(#VERSIONCATTN,:VERSIONATTV), 
        #DATAVERSIONATTN = :DATAVERSIONATTV, 
        #DATAPARTITIONATTN = :DATAPARTITIONATTV`,
    ConditionExpression: "#PKATTN <> :PKATTV",
    ExpressionAttributeValues: {
      ":DATAATTV": {
        "S": JSON.stringify(entityWithLastUpdateDate)
      },
      ":DATAVERSIONATTV": {
        "S": entityWithLastUpdateDate.metadata.dataModelVersion
      },
      ":VERSIONATTV": {
        "N": "1"
      },
      ":PKATTV": {
        "S": entityWithLastUpdateDate.id
      },
      ":DATAPARTITIONATTV": {
        "S": entityWithLastUpdateDate.metadata.partition
      }
    },
    ExpressionAttributeNames: {
      "#DATAATTN": "data",
      "#VERSIONATTN": "version",
      "#VERSIONCATTN": "version",
      "#PKATTN": "id",
      "#DATAVERSIONATTN": "dataModelVersion",
      "#DATAPARTITIONATTN": "partition"
    }
  }));

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error creating item of id: ${entityWithLastUpdateDate.id}`, {
      cause: result.$metadata
    });
  }

  entityWithLastUpdateDate.metadata.objectVersion = 1;

  return {
    ...entityWithLastUpdateDate
  }
}

const updateSSoTEntity = async (entity: SsotEntity): Promise<SsotEntity> => {

  const entityWithLastUpdateDate = addLastUpdateDateToMetadata(entity);
  // incremet object version
  entityWithLastUpdateDate.metadata.objectVersion += 1; 

  const result = await ddbClient.send(new UpdateItemCommand({
    TableName: config.get("ssotTable"),
    "Key": {
      "id": {
        "S": entityWithLastUpdateDate.id
      }
    },
    UpdateExpression: `
      SET 
        #DATAATTN = :DATAATTV, 
        #VERSIONATTN = #VERSIONATTN + :VERSIONATTINCV, 
        #DATAVERSIONATTN = :DATAVERSIONATTV, 
        #DATAPARTITIONATTN = :DATAPARTITIONATTV`,
    ConditionExpression: "#VERSIONATTN = :VERSIONATTCURRV",
    ExpressionAttributeValues: {
      ":DATAATTV": {
        "S": JSON.stringify(entityWithLastUpdateDate)
      },
      ":DATAVERSIONATTV": {
        "S": entityWithLastUpdateDate.metadata.dataModelVersion
      },
      ":VERSIONATTINCV": {
        "N": "1"
      },
      ":VERSIONATTCURRV": {
        "N": entityWithLastUpdateDate.metadata.objectVersion?.toString()
      },
      ":DATAPARTITIONATTV": {
        "S": entityWithLastUpdateDate.metadata.partition
      }
    },
    ExpressionAttributeNames: {
      "#DATAATTN": "data",
      "#VERSIONATTN": "version",
      "#DATAVERSIONATTN": "dataModelVersion",
      "#DATAPARTITIONATTN": "partition"
    },
    ReturnValues: "UPDATED_NEW"
  }));

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error updating item of id ${entityWithLastUpdateDate.id}`, {
      cause: result.$metadata
    });


  }

  const updatedValue = result.Attributes!.data.S!;

  return JSON.parse(updatedValue) as SsotEntity;

}

const deleteSSoTEntity = async (id: string) => {
  await ddbClient.send(new DeleteItemCommand({
    Key: { id: { S: id } },
    TableName: config.get("ssotTable")
  }))
}


const getSSoTEntityById = async (id: string) => {
  const result = await ddbClient.send(new GetItemCommand({
    Key: { id: { S: id } },
    TableName: config.get("ssotTable")
  }));

  if (result.Item == null) {
    return null;
  }


  const data = JSON.parse(result.Item.data.S!);
  const version = result.Item.version.N;
  const dataVersion = result.Item.dataModelVersion.S;

  return {
    data,
    version,
    dataVersion
  }
}

export {
  createSSoTEntity,
  updateSSoTEntity,
  deleteSSoTEntity,
  getSSoTEntityById
}