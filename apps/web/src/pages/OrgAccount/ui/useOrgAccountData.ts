import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEvents } from '@entities/Event';
import { useMyOrg, useOrg } from '@entities/Organization';
import { useAuth } from '@shared/lib/auth-context';
import { useParams } from 'react-router';

export function useOrgAccountData() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isAuthenticated, accountType } = useAuth();
  const { data: org, isLoading, isError } = useOrg(id ?? '');
  const { data: myOrg, isLoading: myOrgLoading } = useMyOrg();
  const { data: orgEventsResult } = useEvents(org ? { organization_id: org.id, page: 1, limit: 20 } : undefined);

  const invalidateOrgQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['organizations'] }),
      queryClient.invalidateQueries({ queryKey: ['organizations', id] }),
      queryClient.invalidateQueries({ queryKey: ['myOrg'] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
    ]);
  }, [id, queryClient]);

  return {
    id,
    org,
    myOrg,
    isLoading,
    isError,
    myOrgLoading,
    isAuthenticated,
    accountType,
    orgEvents: orgEventsResult?.data ?? [],
    invalidateOrgQueries,
  };
}

export function useRequiredOrgAccountData() {
  const data = useOrgAccountData();

  if (!data.org) {
    throw new Error('useRequiredOrgAccountData requires organization data');
  }

  return {
    ...data,
    org: data.org,
  };
}