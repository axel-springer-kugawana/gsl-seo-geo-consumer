import { DeleteItemCommand, DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { config } from "ssot-store/config/configuration-provider";
import { SSoTData, SSoTModel } from "@shared/models/ssot-entity/1.0.0/ssot-model";

const ddbClient = new DynamoDBClient({});


const createSSOTItem = async (id: string, data: SSoTData, dataModelVersion: string, partition: string): Promise<SSoTModel> => {

  const result = await ddbClient.send(new UpdateItemCommand({
    TableName: config.get("ssotTable"),
    Key: {
      "id": {
        "S": id
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
        "S": JSON.stringify(data)
      },
      ":DATAVERSIONATTV": {
        "S": dataModelVersion
      },
      ":VERSIONATTV": {
        "N": "1"
      },
      ":PKATTV": {
        "S": id
      },
      ":DATAPARTITIONATTV": {
        "S": partition 
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
    throw new Error(`Error creating item of id: ${id}`, {
      cause: result.$metadata
    });
  }

  return {
    id,
    dataModelVersion,
    version: 1,
    data,
    partition
  }
}

const updateSSOTItem = async (ssotItem: SSoTModel) : Promise<SSoTModel> => {

  const { id, version, data, dataModelVersion, partition } = ssotItem;

  const result = await ddbClient.send(new UpdateItemCommand({
    TableName: config.get("ssotTable"),
    "Key": {
      "id": {
        "S": id
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
        "S": JSON.stringify(data)
      },
      ":DATAVERSIONATTV": {
        "S": dataModelVersion
      },
      ":VERSIONATTINCV": {
        "N": "1"
      },
      ":VERSIONATTCURRV": {
        "N": version?.toString() 
      },
      ":DATAPARTITIONATTV": {
        "S": partition 
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
    throw new Error(`Error updating item of id ${id}`, {
      cause: result.$metadata
    });
  }

  return {
    id,
    dataModelVersion,
    version,
    data,
    partition
  }

}

const deleteSSOTItem = async <TId extends string>(id: TId) => {
  await ddbClient.send(new DeleteItemCommand({
    Key: { pk: { S: id } },
    TableName: config.get("ssotTable")
  }))
}


const getSSOTItemById = async <TId extends string>(id: TId) => {
  const result = await ddbClient.send(new GetItemCommand({
    Key: { id: { S: id } },
    TableName: config.get("ssotTable")
  }));

  if(result.Item == null) {
    return null;
  }


  const data = JSON.parse(result.Item.data.S!);
  const version = result.Item.version.N;
  const dataVersion = result.Item.dataVersion.S;

  return {
    data,
    version,
    dataVersion
  }
}

export {
  createSSOTItem,
  updateSSOTItem,
  deleteSSOTItem,
  getSSOTItemById
}