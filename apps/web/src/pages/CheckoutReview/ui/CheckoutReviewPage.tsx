import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ChevronLeft, CreditCard, ShieldCheck, Ticket } from 'lucide-react';
import { useEvent } from '@entities/Event';
import { Badge, Button, Input } from '@shared/components';

export function CheckoutReviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const ticketType = searchParams.get('ticketType') ?? 'standard';

  const { data: event, isLoading } = useEvent(eventId ?? '');

  const [promo, setPromo] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const quantity = 1;

  const selectedTicket = useMemo(() => {
    if (!event) return null;
    return event.tickets.find((ticket) => ticket.ticketType === ticketType) ?? event.tickets[0] ?? null;
  }, [event, ticketType]);

  const subtotal = (selectedTicket?.price ?? 0) * quantity;
  const discountRate = isPromoApplied ? 0.15 : 0;
  const discount = subtotal * discountRate;
  const total = Math.max(0, subtotal - discount);

  const currency = selectedTicket?.currency ?? '$';

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading checkout...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to={eventId ? `/events/${eventId}` : '/events'}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to event
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">Checkout review</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review ticket details before payment.
      </p>

      <section className="mt-6 space-y-5 rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Secure purchase flow
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-4">
          <p className="text-xs text-muted-foreground">Event</p>
          <p className="text-sm font-semibold text-foreground">{event?.title ?? `Event ${eventId ?? ''}`}</p>
          <p className="mt-1 text-xs text-muted-foreground">{event?.date} • {event?.time}</p>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Ticket className="h-3.5 w-3.5" />
            Selected ticket
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold capitalize text-foreground">{selectedTicket?.ticketType ?? ticketType}</p>
              <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
            </div>
            <Badge variant="secondary">{currency}{(selectedTicket?.price ?? 0).toFixed(2)}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="promo" className="text-xs text-muted-foreground">Promo code</label>
          <div className="flex gap-2">
            <Input
              id="promo"
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
              placeholder="UEVENT15"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPromoApplied(promo.trim() === 'UEVENT15')}
            >
              Apply
            </Button>
          </div>
          {promo.trim().length > 0 && (
            <p className="text-xs text-muted-foreground">
              {isPromoApplied ? 'Promo applied: 15% discount' : 'Use UEVENT15 for demo discount'}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{currency}{subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>-{currency}{discount.toFixed(2)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-semibold">
            <span>Total</span>
            <span>{currency}{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="gap-1.5" disabled>
            <CreditCard className="h-4 w-4" />
            Proceed to payment
          </Button>
          <Link to={eventId ? `/events/${eventId}` : '/events'} className="text-sm text-primary hover:underline">
            Edit selection
          </Link>
        </div>
      </section>
    </main>
  );
}
