import {
    DynamoDBClient,
    GetItemCommand,
    UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

import { Classified, PublicationStatus } from "models/classified";

const ddbClient = new DynamoDBClient({});

const getClassified = async (id: string): Promise<Classified | null> => {
    const result = await ddbClient.send(
        new GetItemCommand({
            Key: { PK: { S: id } },
            TableName: process.env.CLASSIFIEDS_TABLE,
        })
    );

    if (result?.Item == null) {
        return null;
    }

    const data = JSON.parse(result.Item.data.S!);
    const lastUpdateDate = result.Item.lastUpdateDate.S!;
    const publicationStatus = result.Item.publicationStatus.S! as PublicationStatus;

    return { classifiedId: id, data, lastUpdateDate, publicationStatus };
};

const createClassified = async (classifiedData: Omit<Classified, "classifiedId" | "lastUpdateDate">): Promise<void> => {

    try {

        let classfiedId = randomUUID();

        await ddbClient.send(new UpdateItemCommand({
            TableName: process.env.CLASSIFIEDS_TABLE,
            Key: {
                "id": {
                    "S": classfiedId
                }
            },
            UpdateExpression: `
          SET 
            #DATAATTN = :DATAATTV,
            #VERSIONATTN = :VERSIONATTCURRV
           `,
            ConditionExpression: "attribute_not_exists(#VERSIONATTN) OR #VERSIONATTN < :VERSIONATTCURRV",
            ExpressionAttributeValues: {
                ":DATAATTV": {
                    "S": JSON.stringify(classifiedData)
                },
                ":VERSIONATTCURRV": {
                    "S": new Date().toISOString()
                },
            },
            ExpressionAttributeNames: {
                "#DATAATTN": "data",
                "#VERSIONATTN": "version"

            }
        }));

    } catch (e) {

        if (e.name === "ConditionalCheckFailedException") {
            logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
                classified: classifiedData
            })
        } else {
            throw e;

        }

    }



}

const updatePublicationStatus = async (
    classifiedId: string,
    userId: string,
    desiredPublicationStatus: PublicationStatus): Promise<void> => {
    const result = await ddbClient.send(new UpdateItemCommand({
        TableName: process.env.CLASSIFIEDS_TABLE,
        "Key": {
            "id": {
                "S": classifiedId
            }
        },
        UpdateExpression: `
          SET 
            #pubstatus = :pubstatus`,
        ConditionExpression: "#userId = :userId",
        ExpressionAttributeValues: {
            ":pubstatus": {
                "S": desiredPublicationStatus
            }
        },
        ExpressionAttributeNames: {
            "#pubstatus": "publicationStatus"
        },
        ReturnValues: "UPDATED_NEW"
    }));

    if (result.$metadata.httpStatusCode !== 200) {
        throw new Error(`Error updating publication status of id ${classifiedId} to ${desiredPublicationStatus}`, {
            cause: result.$metadata
        });


    }

};

const markClassifiedForDeletion = async (classifiedId: string, expiryInDays: number): Promise<void> => {

    const onDayInSeconds = 60 * 60 * 24 * expiryInDays;
    const expiryTime = Math.floor(Date.now() / 1000) + onDayInSeconds;

    const result = await ddbClient.send(new UpdateItemCommand({
        TableName: process.env.CLASSIFIEDS_TABLE,
        Key: {
            "id": {
                "S": classifiedId
            }
        },
        UpdateExpression: `
      SET 
        #EXPIREAT = :EXPIREAT,
        #SOFTDELETE = :SOFTDELETE`,
        ExpressionAttributeValues: {
            ":EXPIREAT": {
                "N": expiryTime.toString()
            },
            ":SOFTDELETE": {
                "BOOL": true
            },
        },

        ExpressionAttributeNames: {
            "#EXPIREAT": "expireat",
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
    getClassified,
    updatePublicationStatus,
    markClassifiedForDeletion,
    createOrUpdateClassified
};