import { authApi } from '@shared/api/auth.api'
import { useAuth } from '@shared/lib/auth-context'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function useCalendarSync(eventId?: string, ticketId?: string | null) {
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
      toast.success('Event and ticket added to Google Calendar!', {
        action:
          data.ticketResult?.htmlLink || data.eventResult?.htmlLink
            ? {
                label: 'Open',
                onClick: () => window.open(data.ticketResult?.htmlLink ?? data.eventResult?.htmlLink ?? '', '_blank'),
              }
            : undefined,
      })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? ''
      const lower = msg.toLowerCase()
      if (lower.includes('google calendar api is disabled')) {
        toast.error(
          'Google Calendar API is disabled in Google Cloud. Enable calendar-json.googleapis.com and try again.',
        )
        return
      }
      if (
        lower.includes('google account not linked') ||
        lower.includes('please re-login') ||
        lower.includes('google calendar access denied')
      ) {
        toast.error('Google account not linked. Log in with Google to enable calendar sync.', {
          action: { label: 'Link Google', onClick: () => window.location.assign('/api/auth/google') },
        })
      } else {
        toast.error('Could not add to Google Calendar.')
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
