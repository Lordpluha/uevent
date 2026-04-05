import { useEvents } from '@entities/Event'
import { useMyOrg } from '@entities/Organization'
import { ticketsApi } from '@entities/Ticket'
import { useMe } from '@entities/User'
import { useAuth } from '@shared/lib/auth-context'
import { useQuery } from '@tanstack/react-query'

export function useProfileViewData() {
  const { isAuthenticated, accountType, isReady } = useAuth()
  const { data: myOrg, isLoading: myOrgLoading } = useMyOrg()
  const { data: user, isLoading, isError } = useMe()
  const { data: eventsResult } = useEvents({ page: 1, limit: 4, user_id: user?.id }, !!user?.id)
  const myEvents = eventsResult?.data ?? []

  const { data: ticketsResult, isLoading: ticketsLoading } = useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: () => ticketsApi.getByUser(user?.id ?? '', { page: 1, limit: 20 }),
    enabled: !!user?.id,
  })

  return {
    isAuthenticated,
    accountType,
    isReady,
    myOrg,
    myOrgLoading,
    user,
    isLoading,
    isError,
    myEvents,
    myTickets: ticketsResult?.data ?? [],
    ticketsLoading,
  }
}
