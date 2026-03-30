import { Link, useParams, useSearchParams } from 'react-router';
import { CalendarCheck, CalendarPlus, CheckCircle2, Download, ExternalLink, Loader2, Ticket } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button } from '@shared/components';
import { api } from '@shared/api';
import { useAuth } from '@shared/lib/auth-context';
import { useCalendarSync } from './useCalendarSync';

export function CheckoutSuccessPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, accountType } = useAuth();

  const ticketType = searchParams.get('ticketType') ?? 'standard';
  const quantity = Number(searchParams.get('qty') ?? '1');
  const promo = searchParams.get('promo') ?? '';
  const total = Number(searchParams.get('total') ?? '0');
  const currency = searchParams.get('currency') ?? '$';
  const orderId = searchParams.get('order') ?? 'DEMO-0001';
  const ticketId = searchParams.get('ticketId');

  const { data: paymentData, isLoading: isPaymentLoading } = useQuery<{
    status: string;
    amount: number;
    currency: string;
  }>({
    queryKey: ['payment-status', orderId],
    queryFn: async () => {
      const res = await api.get(`/payments/${orderId}`);
      return res.data;
    },
    enabled: !!orderId && orderId !== 'DEMO-0001',
    retry: 3,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'succeeded' || status === 'canceled') return false;
      return 3000;
    },
  });

  const paymentConfirmed = paymentData?.status === 'succeeded';
  const paymentProcessing = isPaymentLoading || paymentData?.status === 'processing';

  const { calendarMutation, calendarStatus } = useCalendarSync(eventId, ticketId);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          {paymentProcessing ? (
            <>
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Confirming payment…</h1>
                <p className="text-sm text-muted-foreground">We're verifying your payment. This usually takes a few seconds.</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Payment successful</h1>
                <p className="text-sm text-muted-foreground">Your ticket reservation is confirmed.</p>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 grid gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="font-semibold text-foreground">{orderId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Event ID</p>
            <p className="font-semibold text-foreground">{eventId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ticket type</p>
            <p className="font-semibold capitalize text-foreground">{ticketType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="font-semibold text-foreground">{Number.isFinite(quantity) ? quantity : 1}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total paid</p>
            <p className="font-semibold text-foreground">{currency}{Number.isFinite(total) ? total.toFixed(2) : '0.00'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Promo code</p>
            {promo ? <Badge variant="secondary">{promo}</Badge> : <p className="font-semibold text-foreground">None</p>}
          </div>
        </div>

        {/* Google Calendar status */}
        {isAuthenticated && accountType === 'user' && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
            {calendarStatus === 'pending' && (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Adding event and ticket to Google Calendar…</p>
              </>
            )}
            {calendarStatus === 'added' && (
              <>
                <CalendarCheck className="h-5 w-5 text-emerald-500" />
                <p className="text-sm font-medium text-foreground">Event and ticket added to your Google Calendar</p>
                {(calendarMutation.data?.ticketResult?.htmlLink || calendarMutation.data?.eventResult?.htmlLink) && (
                  <a
                    href={calendarMutation.data?.ticketResult?.htmlLink ?? calendarMutation.data?.eventResult?.htmlLink ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </>
            )}
            {calendarStatus === 'error' && (
              <>
                <CalendarPlus className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Calendar sync unavailable</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto text-xs"
                  onClick={() => calendarMutation.mutate()}
                >
                  Retry
                </Button>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button className="gap-1.5" variant="outline" disabled>
            <Download className="h-4 w-4" />
            Download ticket (soon)
          </Button>
          <Link to={eventId ? `/events/${eventId}` : '/events'}>
            <Button className="gap-1.5">
              <Ticket className="h-4 w-4" />
              Back to event
            </Button>
          </Link>
          <Link to="/events" className="self-center text-sm text-primary hover:underline">
            Discover more events
          </Link>
        </div>
      </section>
    </main>
  );
}

