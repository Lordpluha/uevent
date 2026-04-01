import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMe } from '@entities/User';
import { useAuth } from '@shared/lib/auth-context';
import type { UserProfile } from './types';

export function useProfileSettingsData() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isReady } = useAuth();
  const { data: user, isLoading } = useMe();

  const invalidateUser = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
    ]);
  }, [queryClient]);

  const userProfile: UserProfile = {
    name: user?.name ?? '',
    username: user?.username ?? '',
    bio: user?.bio ?? '',
    location: user?.location ?? '',
    website: user?.website ?? '',
    avatarUrl: user?.avatarUrl,
    timezone: user?.timezone,
    interests: user?.interests ?? [],
    twoFa: user?.twoFa,
    notificationsEnabled: user?.notificationsEnabled,
    pushNotificationsEnabled: user?.pushNotificationsEnabled,
    paymentEmailEnabled: user?.paymentEmailEnabled,
    subscriptionNotificationsEnabled: user?.subscriptionNotificationsEnabled,
    loginNotificationsEnabled: user?.loginNotificationsEnabled,
  };

  return {
    userProfile,
    isAuthenticated,
    isReady,
    isLoading,
    twoFa: user?.twoFa ?? false,
    invalidateUser,
  };
}