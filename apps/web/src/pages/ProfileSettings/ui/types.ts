export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl?: string;
  timezone?: string;
  interests: string[];
  twoFa?: boolean;
  notificationsEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  paymentEmailEnabled?: boolean;
  subscriptionNotificationsEnabled?: boolean;
  loginNotificationsEnabled?: boolean;
}
