import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ChevronLeft, CreditCard, Minus, Plus, ShieldCheck, Ticket } from 'lucide-react';
import { useEvent } from '@entities/Event';
import { Badge, Button, PromoCodeSection } from '@shared/components';

const VALID_PROMO_CODES: Record<string, number> = {
  UEVENT15: 15,
  UEVENT20: 20,
  UEVENT10: 10,
  SUMMER25: 25,
  EARLY30: 30,
};

export function CheckoutReviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticketType = searchParams.get('ticketType') ?? 'standard';
  const promoFromQuery = (searchParams.get('promo') ?? '').toUpperCase();

  const { data: event, isLoading } = useEvent(eventId ?? '');

  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>();
  const [appliedPromoDiscount, setAppliedPromoDiscount] = useState<number | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (!promoFromQuery) return;
    const discount = VALID_PROMO_CODES[promoFromQuery];
    if (!discount) return;
    setAppliedPromoCode(promoFromQuery);
    setAppliedPromoDiscount(discount);
  }, [promoFromQuery]);

  const selectedTicket = useMemo(() => {
    if (!event) return null;
    return event.tickets.find((ticket) => ticket.ticketType === ticketType) ?? event.tickets[0] ?? null;
  }, [event, ticketType]);

  const subtotal = (selectedTicket?.price ?? 0) * quantity;
  const discountRate = (appliedPromoDiscount ?? 0) / 100;
  const discount = subtotal * discountRate;
  const total = Math.max(0, subtotal - discount);

  const currency = selectedTicket?.currency ?? '$';

  const handleProceedToPayment = () => {
    if (!eventId || !selectedTicket) return;

    setIsProcessingPayment(true);

    const params = new URLSearchParams({
      ticketType: selectedTicket.ticketType,
      qty: String(quantity),
      total: total.toFixed(2),
      currency,
      order: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    });

    if (appliedPromoCode) {
      params.set('promo', appliedPromoCode);
    }

    window.setTimeout(() => {
      navigate(`/checkout/${eventId}/success?${params.toString()}`);
    }, 700);
  };

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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold capitalize text-foreground">{selectedTicket?.ticketType ?? ticketType}</p>
              <p className="text-xs text-muted-foreground">Unit price: {currency}{(selectedTicket?.price ?? 0).toFixed(2)}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-foreground">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <Badge variant="secondary">Qty: {quantity}</Badge>
          </div>
        </div>

        <PromoCodeSection
          onApplyPromo={(code, discountPercent) => {
            setAppliedPromoCode(code);
            setAppliedPromoDiscount(discountPercent);
          }}
          onRemovePromo={() => {
            setAppliedPromoCode(undefined);
            setAppliedPromoDiscount(undefined);
          }}
          appliedCode={appliedPromoCode}
          appliedDiscount={appliedPromoDiscount}
        />

        <div className="rounded-lg border border-border/60 bg-background/40 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal ({quantity} x ticket)</span>
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
          <Button className="gap-1.5" onClick={handleProceedToPayment} disabled={isProcessingPayment || !selectedTicket}>
            <CreditCard className="h-4 w-4" />
            {isProcessingPayment ? 'Processing...' : 'Proceed to payment'}
          </Button>
          <Link to={eventId ? `/events/${eventId}` : '/events'} className="text-sm text-primary hover:underline">
            Edit selection
          </Link>
        </div>
      </section>
    </main>
  );
}
