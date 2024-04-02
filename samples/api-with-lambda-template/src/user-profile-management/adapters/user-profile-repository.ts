import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { config } from '../config/configuration-provider';
import { v4 as uuidv4 } from 'uuid';
import {
  UserProfile,
  UserProfileData
} from '@user-profile-management/models/user-profile';

const ddbClient = new DynamoDBClient({});

const getUserProfileById = async (
  userId: string
): Promise<UserProfile | null> => {
  const result = await ddbClient.send(
    new GetItemCommand({
      Key: { id: { S: userId } },
      TableName: config.get('UserProfileTable')
    })
  );

  if (result?.Item == null) {
    return null;
  }

  const data = JSON.parse(result.Item.data.S!) as UserProfileData;

  return { id: result.Item.id.S!, ...data };
};

const updateUserProfile = async (
  userId: string,
  userProfileData: UserProfileData
): Promise<UserProfile> => {
  const result = await ddbClient.send(
    new UpdateItemCommand({
      TableName: config.get('UserProfileTable'),
      Key: {
        id: {
          S: userId
        }
      },
      UpdateExpression: `
      SET 
        #data = :data`,
      ExpressionAttributeValues: {
        ':data': {
          S: JSON.stringify(userProfileData)
        }
      },
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeNames: {
        '#data': 'data'
      },
      ReturnValues: 'ALL_NEW'
    })
  );

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error updating item of id`, {
      cause: result.$metadata
    });
  }

  return {
    id: userId,
    ...userProfileData
  };
};

const createUserProfile = async (
  userProfileData: UserProfileData
): Promise<UserProfile> => {
  const userId = uuidv4();

  const result = await ddbClient.send(
    new PutItemCommand({
      TableName: config.get('UserProfileTable'),
      Item: {
        id: {
          S: userId
        },
        data: {
          S: JSON.stringify(userProfileData)
        }
      },
      ConditionExpression: 'attribute_not_exists(id)'
    })
  );

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error creating item of id`, {
      cause: result.$metadata
    });
  }

  return {
    id: userId,
    ...userProfileData
  };
};

const deleteUserProfile = async (userId: string): Promise<void> => {
  const result = await ddbClient.send(
    new DeleteItemCommand({
      TableName: config.get('UserProfileTable'),
      Key: {
        id: {
          S: userId
        }
      }
    })
  );

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Error deleting item of id`, {
      cause: result.$metadata
    });
  }
};

export {
  getUserProfileById,
  updateUserProfile,
  deleteUserProfile,
  createUserProfile
};
