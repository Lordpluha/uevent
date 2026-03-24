import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/user.api';
import type { UserListParams } from '../model/dtos';

export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: ['users', params ?? {}],
    queryFn: () => usersApi.getAll(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getOne(id),
    enabled: !!id,
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe(),
  });
}
