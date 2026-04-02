import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvents } from '@entities/Event';
import { useMyOrg, useOrg } from '@entities/Organization';
import { api } from '@shared/api';
import { useAuth } from '@shared/lib/auth-context';
import { useParams } from 'react-router';

export function useOrgAccountData() {
  const { id: paramId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isAuthenticated, accountType, isReady } = useAuth();
  const { data: myOrg, isLoading: myOrgLoading } = useMyOrg();
  const id = paramId ?? myOrg?.id;
  const { data: org, isLoading, isError } = useOrg(id ?? '');
  const { data: orgEventsResult } = useEvents(org ? { organization_id: org.id, page: 1, limit: 20 } : undefined);
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['organization-wallet'],
    queryFn: async () => (await api.get('/payments/organization/wallet')).data,
    enabled: isAuthenticated && accountType === 'organization',
  });
  const { data: verification, isLoading: verificationLoading } = useQuery({
    queryKey: ['organization-verification'],
    queryFn: async () => (await api.get('/payments/organization/verification')).data,
    enabled: isAuthenticated && accountType === 'organization',
  });

  const invalidateOrgQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['organizations'] }),
      queryClient.invalidateQueries({ queryKey: ['organizations', id] }),
      queryClient.invalidateQueries({ queryKey: ['myOrg'] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
      queryClient.invalidateQueries({ queryKey: ['organization-wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['organization-verification'] }),
    ]);
  }, [id, queryClient]);

  return {
    id,
    org,
    myOrg,
    isLoading,
    isError,
    myOrgLoading,
    wallet,
    walletLoading,
    verification,
    verificationLoading,
    isAuthenticated,
    accountType,
    isReady,
    orgEvents: orgEventsResult?.data ?? [],
    invalidateOrgQueries,
  };
}

export function useRequiredOrgAccountData() {
  const data = useOrgAccountData();

  if (!data.isLoading && !data.myOrgLoading && !data.org) {
    throw new Error('useRequiredOrgAccountData requires organization data');
  }

  return {
    ...data,
    org: data.org,
  };
}