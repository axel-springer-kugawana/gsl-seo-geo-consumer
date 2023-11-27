import { DeleteItemCommand, DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { config } from "ssot-store/config/configuration-provider";
import { SSoTEntity } from "@shared/models/ssot-entity/1.0.0/ssot-model";

const ddbClient = new DynamoDBClient({});

const createSSoTEntity = async (entity: SSoTEntity): Promise<SSoTEntity> => {

  const result = await ddbClient.send(new UpdateItemCommand({
    TableName: config.get("ssotTable"),
    Key: {
      "id": {
        "S": entity.id
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
        "S": JSON.stringify(entity)
      },
      ":DATAVERSIONATTV": {
        "S": entity.metadata.dataModelVersion
      },
      ":VERSIONATTV": {
        "N": "1"
      },
      ":PKATTV": {
        "S": entity.id
      },
      ":DATAPARTITIONATTV": {
        "S": entity.metadata.partition 
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
    throw new Error(`Error creating item of id: ${entity.id}`, {
      cause: result.$metadata
    });
  }

  entity.metadata.objectVersion = 1;

  return {
    ...entity
  }
}

const updateSSoTEntity = async (entity: SSoTEntity) : Promise<SSoTEntity> => {


  const result = await ddbClient.send(new UpdateItemCommand({
    TableName: config.get("ssotTable"),
    "Key": {
      "id": {
        "S": entity.id
      }
    },
    UpdateExpression: `
      SET 
        #DATAATTN = :DATAATTV, 
        #VERSIONATTN = :VERSIONATTN + :VERSIONATTINCV, 
        #DATAVERSIONATTN = :DATAVERSIONATTV, 
        #DATAPARTITIONATTN = :DATAPARTITIONATTV`,
    ConditionExpression: "#VERSIONATTN = :VERSIONATTCURRV",
    ExpressionAttributeValues: {
      ":DATAATTV": {
        "S": JSON.stringify(entity)
      },
      ":DATAVERSIONATTV": {
        "S": entity.metadata.dataModelVersion
      },
      ":VERSIONATTINCV": {
        "N": "1"
      },
      ":VERSIONATTCURRV": {
        "N": entity.metadata.objectVersion?.toString() 
      },
      ":DATAPARTITIONATTV": {
        "S": entity.metadata.partition
      }
    },
    ExpressionAttributeNames: {
      "#DATAATTN": "data",
      "#VERSIONATTN": "version",
      "#DATAVERSIONATTN": "dataModelVersion",
      "#DATAPARTITIONATTN": "partition"
    }
  }));


  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error updating item of id ${entity.id}`, {
      cause: result.$metadata
    });
  }

  return entity;

}

const deleteSSoTEntity = async (id: string) => {
  await ddbClient.send(new DeleteItemCommand({
    Key: { pk: { S: id } },
    TableName: config.get("ssotTable")
  }))
}


const getSSoTEntityById = async (id: string) => {
  const result = await ddbClient.send(new GetItemCommand({
    Key: { id: { S: id } },
    TableName: config.get("ssotTable")
  }));

  if(result.Item == null) {
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