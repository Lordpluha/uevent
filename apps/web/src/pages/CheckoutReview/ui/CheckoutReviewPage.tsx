import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ChevronLeft, CreditCard, Minus, Plus, ShieldCheck, Ticket } from 'lucide-react';
import { useEvent } from '@entities/Event';
import { useMe } from '@entities/User';
import { Badge, Button, PromoCodeSection } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useCheckoutPayment } from './useCheckoutPayment';

const VALID_PROMO_CODES: Record<string, number> = {
  UEVENT15: 15,
  UEVENT20: 20,
  UEVENT10: 10,
  SUMMER25: 25,
  EARLY30: 30,
};

export function CheckoutReviewPage() {
  const { t } = useAppContext();
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const ticketType = searchParams.get('ticketType') ?? 'standard';
  const ticketTypeLabel = ticketType === 'free' ? t.common.free : ticketType === 'vip' ? t.common.vip : t.common.standard;
  const promoFromQuery = (searchParams.get('promo') ?? '').toUpperCase();

  const { data: event, isLoading } = useEvent(eventId ?? '');
  const { data: me } = useMe();

  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>();
  const [appliedPromoDiscount, setAppliedPromoDiscount] = useState<number | undefined>();
  const [quantity, setQuantity] = useState(1);

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
  const remaining = selectedTicket?.quantityLimited
    ? Math.max(0, (selectedTicket?.quantityTotal ?? 0) - (selectedTicket?.quantitySold ?? 0))
    : undefined;
  const maxQuantity = selectedTicket?.quantityLimited ? Math.max(1, Math.min(remaining ?? 1, 50)) : 10;

  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(q, maxQuantity)));
  }, [maxQuantity]);

  const { isProcessingPayment, handleProceedToPayment } = useCheckoutPayment({
    eventId,
    selectedTicket,
    total,
    quantity,
    remaining,
    currency,
    appliedPromoCode,
    me,
    event,
  });

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.checkoutReview.loading}</p>
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
        {t.common.backToEvent}
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">{t.checkoutReview.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t.checkoutReview.subtitle}
      </p>

      <section className="mt-6 space-y-5 rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {t.checkoutReview.securePurchase}
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-4">
          <p className="text-xs text-muted-foreground">{t.checkout.event}</p>
          <p className="text-sm font-semibold text-foreground">{event?.title ?? `${t.checkout.event} #${eventId ?? ''}`}</p>
          <p className="mt-1 text-xs text-muted-foreground">{event?.date} • {event?.time}</p>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Ticket className="h-3.5 w-3.5" />
            {t.checkoutReview.selectedTicket}
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold capitalize text-foreground">{selectedTicket?.ticketType === 'free' ? t.common.free : selectedTicket?.ticketType === 'vip' ? t.common.vip : selectedTicket?.ticketType === 'standard' ? t.common.standard : ticketTypeLabel}</p>
              <p className="text-xs text-muted-foreground">{t.checkoutReview.unitPrice} {currency}{(selectedTicket?.price ?? 0).toFixed(2)}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/60 px-2 py-1">
                <button
                  type="button"
                  aria-label={t.checkoutReview.decreaseQuantity}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-foreground">{quantity}</span>
                <button
                  type="button"
                  aria-label={t.checkoutReview.increaseQuantity}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {selectedTicket?.quantityLimited && (
                <p className="mt-1 text-xs text-muted-foreground">{t.checkoutReview.available} {remaining ?? 0}</p>
              )}
            </div>
            <Badge variant="secondary">{t.checkoutReview.quantityShort}: {quantity}</Badge>
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
            <span className="text-muted-foreground">{t.checkoutReview.subtotal.replace('{{qty}}', String(quantity))}</span>
            <span>{currency}{subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">{t.common.discount}</span>
            <span>-{currency}{discount.toFixed(2)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-semibold">
            <span>{t.common.total}</span>
            <span>{currency}{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="gap-1.5" onClick={handleProceedToPayment} disabled={isProcessingPayment || !selectedTicket}>
            <CreditCard className="h-4 w-4" />
            {isProcessingPayment ? t.common.processing : t.checkoutReview.proceedToPayment}
          </Button>
          <Link to={eventId ? `/events/${eventId}` : '/events'} className="text-sm text-primary hover:underline">
            {t.checkoutReview.editSelection}
          </Link>
        </div>
      </section>
    </main>
  );
}
