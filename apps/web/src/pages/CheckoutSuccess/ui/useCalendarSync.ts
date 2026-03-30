import { authApi } from '@shared/api/auth.api'
import { useAppContext } from '@shared/lib'
import { useAuth } from '@shared/lib/auth-context'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function useCalendarSync(eventId?: string, ticketId?: string | null) {
  const { t } = useAppContext()
  const { isAuthenticated, accountType } = useAuth()
  const autoAddedRef = useRef(false)

  const calendarMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error('No event id')
      const eventResult = await authApi.addToGoogleCalendar(eventId)
      const ticketResult = ticketId ? await authApi.addTicketToGoogleCalendar(ticketId) : null
      return { eventResult, ticketResult }
    },
    onSuccess: (data) => {
      localStorage.removeItem('pendingPayment')
      toast.success(t.checkoutSuccess.calendarAdded, {
        action:
          data.ticketResult?.htmlLink || data.eventResult?.htmlLink
            ? {
                label: t.common.open,
                onClick: () => window.open(data.ticketResult?.htmlLink ?? data.eventResult?.htmlLink ?? '', '_blank'),
              }
            : undefined,
      })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? ''
      const lower = msg.toLowerCase()
      if (lower.includes('google calendar api is disabled')) {
        toast.error(t.events.details.calendarApiDisabled)
        return
      }
      if (
        lower.includes('google account not linked') ||
        lower.includes('please re-login') ||
        lower.includes('google calendar access denied')
      ) {
        toast.error(t.events.details.calendarAccessDenied, {
          action: { label: t.events.details.calendarLinkGoogle, onClick: () => window.location.assign('/api/auth/google') },
        })
      } else {
        toast.error(t.events.details.calendarFailed)
      }
    },
  })

  const mutate = calendarMutation.mutate

  useEffect(() => {
    if (autoAddedRef.current) return
    if (!isAuthenticated || accountType !== 'user' || !eventId) return
    autoAddedRef.current = true
    mutate()
  }, [isAuthenticated, accountType, eventId, mutate])

  useEffect(() => {
    return () => {
      if (calendarMutation.isSuccess) return
      localStorage.removeItem('pendingPayment')
    }
  }, [calendarMutation.isSuccess])

  const calendarStatus = calendarMutation.isSuccess
    ? 'added'
    : calendarMutation.isError
      ? 'error'
      : calendarMutation.isPending
        ? 'pending'
        : 'idle'

  return { calendarMutation, calendarStatus } as const
}
