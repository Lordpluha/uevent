import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/user.api';
import type { UserListParams } from '../model/dtos';
import { useAuth } from '@shared/lib/auth-context';
import { mapApiUser } from '../model/userEntity';

export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: ['users', params ?? {}],
    queryFn: () => usersApi.getAll(params),
    select: (data) => data.data.map(mapApiUser),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getOne(id),
    enabled: !!id,
    select: mapApiUser,
  });
}

export function useMe() {
  const { isAuthenticated, accountType } = useAuth();
  return useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe(),
    enabled: isAuthenticated && accountType === 'user',
    select: mapApiUser,
  });
}

