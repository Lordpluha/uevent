import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '../api/organization.api';
import type { OrganizationListParams } from '../model/dtos';

export function useOrgs(params?: OrganizationListParams) {
  return useQuery({
    queryKey: ['organizations', params ?? {}],
    queryFn: () => organizationsApi.getAll(params),
  });
}

export function useOrg(id: string) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizationsApi.getOne(id),
    enabled: !!id,
  });
}
