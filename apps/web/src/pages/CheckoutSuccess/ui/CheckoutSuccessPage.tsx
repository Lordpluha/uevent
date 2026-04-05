import { api } from '@shared/api'
import { Badge, Button } from '@shared/components'
import { getCurrencySymbol } from '@shared/config/payment'
import { usePaymentConfig } from '@shared/hooks/usePaymentConfig'
import { useAppContext } from '@shared/lib'
import { useAuth } from '@shared/lib/auth-context'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, CalendarPlus, CheckCircle2, Download, ExternalLink, Loader2, Ticket } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useCalendarSync } from './useCalendarSync'

export function CheckoutSuccessPage() {
  const { t } = useAppContext()
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, accountType } = useAuth()
  const { data: paymentConfig } = usePaymentConfig()

  const ticketType = searchParams.get('ticketType') ?? 'standard'
  const ticketTypeLabel =
    ticketType === 'free' ? t.common.free : ticketType === 'vip' ? t.common.vip : t.common.standard
  const quantity = Number(searchParams.get('qty') ?? '1')
  const promo = searchParams.get('promo') ?? ''
  const total = Number(searchParams.get('total') ?? '0')
  const currency = getCurrencySymbol({ currency: searchParams.get('currency'), paymentConfig })
  const orderId = searchParams.get('order')
  const ticketId = searchParams.get('ticketId')

  const { data: paymentData, isLoading: isPaymentLoading } = useQuery<{
    status: string
    amount: number
    currency: string
  }>({
    queryKey: ['payment-status', orderId],
    queryFn: async () => {
      const res = await api.get(`/payments/${orderId}`)
      return res.data
    },
    enabled: !!orderId,
    retry: 3,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'succeeded' || status === 'canceled') return false
      return 3000
    },
  })

  const paymentProcessing = isPaymentLoading || paymentData?.status === 'processing'

  useEffect(() => {
    if (!orderId || !isAuthenticated || accountType !== 'user') return

    void api.post(`/payments/${orderId}/reconcile`).catch(() => {
      // Best-effort recovery for old orders where webhook didn't issue all user tickets.
    })
  }, [orderId, isAuthenticated, accountType])

  const handleDownloadTicket = async () => {
    if (!orderId) {
      toast.error('Missing order id')
      return
    }

    try {
      const response = await api.get<Blob>(`/payments/${orderId}/ticket-pdf`, {
        responseType: 'blob',
      })

      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `uevent-ticket-${orderId}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download ticket PDF')
    }
  }

  const { calendarMutation, calendarStatus } = useCalendarSync(eventId, ticketId)

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          {paymentProcessing ? (
            <>
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {t.checkoutSuccess.confirming}
                </h1>
                <p className="text-sm text-muted-foreground">{t.checkoutSuccess.confirmingDesc}</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t.checkoutSuccess.success}</h1>
                <p className="text-sm text-muted-foreground">{t.checkoutSuccess.successDesc}</p>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 grid gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t.checkoutSuccess.orderId}</p>
            <p className="font-semibold text-foreground">{orderId ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.checkoutSuccess.eventId}</p>
            <p className="font-semibold text-foreground">{eventId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.checkoutSuccess.ticketType}</p>
            <p className="font-semibold capitalize text-foreground">{ticketTypeLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.common.quantity}</p>
            <p className="font-semibold text-foreground">{Number.isFinite(quantity) ? quantity : 1}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.checkoutSuccess.totalPaid}</p>
            <p className="font-semibold text-foreground">
              {currency}
              {Number.isFinite(total) ? total.toFixed(2) : '0.00'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.checkoutSuccess.promoCode}</p>
            {promo ? (
              <Badge variant="secondary">{promo}</Badge>
            ) : (
              <p className="font-semibold text-foreground">{t.common.none}</p>
            )}
          </div>
        </div>

        {/* Google Calendar status */}
        {isAuthenticated && accountType === 'user' && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
            {calendarStatus === 'pending' && (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">{t.checkoutSuccess.calendarAdding}</p>
              </>
            )}
            {calendarStatus === 'added' && (
              <>
                <CalendarCheck className="h-5 w-5 text-emerald-500" />
                <p className="text-sm font-medium text-foreground">{t.checkoutSuccess.calendarAdded}</p>
                {(calendarMutation.data?.ticketResult?.htmlLink || calendarMutation.data?.eventResult?.htmlLink) && (
                  <a
                    href={
                      calendarMutation.data?.ticketResult?.htmlLink ??
                      calendarMutation.data?.eventResult?.htmlLink ??
                      '#'
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {t.common.open} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </>
            )}
            {calendarStatus === 'error' && (
              <>
                <CalendarPlus className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t.checkoutSuccess.calendarUnavailable}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto text-xs"
                  onClick={() => calendarMutation.mutate()}
                >
                  {t.common.retry}
                </Button>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button className="gap-1.5" variant="outline" onClick={handleDownloadTicket}>
            <Download className="h-4 w-4" />
            {t.checkoutSuccess.downloadTicket}
          </Button>
          <Link to={eventId ? `/events/${eventId}` : '/events'}>
            <Button className="gap-1.5">
              <Ticket className="h-4 w-4" />
              {t.common.backToEvent}
            </Button>
          </Link>
          <Link to="/events" className="self-center text-sm text-primary hover:underline">
            {t.checkoutSuccess.discoverMore}
          </Link>
        </div>
      </section>
    </main>
  )
}
