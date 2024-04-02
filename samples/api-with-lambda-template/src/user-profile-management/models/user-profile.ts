export type UserId = {
  id: string;
};

export type UserProfileData = {
  firstName: string;
  lastName: string;
  email: string;
};

export type UserProfile = UserId & UserProfileData;
