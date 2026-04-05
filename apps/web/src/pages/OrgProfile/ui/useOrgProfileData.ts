import { useEvents } from '@entities/Event'
import { organizationsApi, useMyOrg, useOrg } from '@entities/Organization'
import { useAppContext } from '@shared/lib'
import { useAuth } from '@shared/lib/auth-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

export function useOrgProfileData(overrideId?: string) {
  const { t } = useAppContext()
  const { isAuthenticated, accountType } = useAuth()
  const queryClient = useQueryClient()
  const { data: myOrg } = useMyOrg()
  const { id: paramId } = useParams<{ id: string }>()
  const id = overrideId ?? paramId
  const { data: org, isLoading } = useOrg(id ?? '')
  const { data: orgEventsResult } = useEvents(org ? { organization_id: org.id } : undefined)
  const orgEvents = orgEventsResult?.data ?? []
  const isUserViewer = isAuthenticated && accountType === 'user'
  const orgId = org?.id ?? ''

  const { data: followStatus } = useQuery({
    queryKey: ['organization-follow', orgId],
    queryFn: () => organizationsApi.getFollowStatus(orgId),
    enabled: isUserViewer && !!orgId,
  })

  const followMutation = useMutation({
    mutationFn: (nextFollow: boolean) => organizationsApi.setFollow(orgId, nextFollow),
    onSuccess: async (_data, nextFollow) => {
      await queryClient.invalidateQueries({ queryKey: ['organization-follow', orgId] })
      await queryClient.invalidateQueries({ queryKey: ['organizations', orgId] })
      toast.success(nextFollow ? t.organizations.subscribed : t.organizations.unsubscribed)
    },
    onError: () => {
      toast.error(t.organizations.subscribeFailed)
    },
  })

  const toggleFollow = useCallback(() => {
    const isFollowed = followStatus?.followed ?? false
    followMutation.mutate(!isFollowed)
  }, [followMutation, followStatus?.followed])

  return {
    org,
    isLoading,
    displayEvents: orgEvents,
    isOwner: isAuthenticated && accountType === 'organization' && myOrg?.id === org?.id,
    isUserViewer,
    isFollowed: followStatus?.followed ?? false,
    isFollowPending: followMutation.isPending,
    toggleFollow,
  }
}

export function useRequiredOrgProfileData(overrideId?: string) {
  const data = useOrgProfileData(overrideId)

  if (!data.org) {
    throw new Error('useRequiredOrgProfileData requires organization data')
  }

  return {
    ...data,
    org: data.org,
  }
}
