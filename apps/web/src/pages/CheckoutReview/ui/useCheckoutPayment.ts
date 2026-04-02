import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '@shared/api';
import { useAppContext } from '@shared/lib';

interface UseCheckoutPaymentOptions {
  eventId?: string;
  selectedTicket: {
    id: string;
    ticketType: string;
    price: number;
    quantityLimited?: boolean;
    currency?: string;
  } | null;
  total: number;
  displayPrice: number;
  quantity: number;
  remaining?: number;
  currency: string;
  appliedPromoCode?: string;
  appliedPromoId?: string;
  appliedPromoDiscount?: number;
  me?: { email?: string; name?: string } | null;
  event?: { title?: string; date?: string; time?: string; location?: string; organizer?: string } | null;
}

export function useCheckoutPayment({
  eventId,
  selectedTicket,
  total,
  displayPrice,
  quantity,
  remaining,
  currency,
  appliedPromoCode,
  appliedPromoId,
  appliedPromoDiscount,
  me,
  event,
}: UseCheckoutPaymentOptions) {
  const navigate = useNavigate();
  const { t } = useAppContext();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleProceedToPayment = async () => {
    if (!eventId || !selectedTicket) return;
    if (selectedTicket.quantityLimited && (remaining ?? 0) <= 0) {
      toast.error(t.checkoutReview.soldOut);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const orderId = `ticket-${selectedTicket.id}-event-${eventId}-${Date.now()}`;
      const amountInCents = Math.round(total * 100);

      const response = await api.post<{ clientSecret: string | null; paymentIntentId: string }>('/payments/create-intent', {
        amount: amountInCents,
        orderId,
        eventId,
        ticketId: selectedTicket.id,
        quantity,
        userEmail: me?.email,
        userName: me?.name,
        eventTitle: event?.title,
        ticketName: selectedTicket.ticketType,
        eventDate: event?.date,
        eventLocation: event?.location,
        organizationName: event?.organizer,
        promoCode: appliedPromoCode,
        promoCodeId: appliedPromoId,
        promoDiscountPercent: appliedPromoDiscount,
      });

      localStorage.setItem('pendingPayment', JSON.stringify({
        clientSecret: response.data.clientSecret,
        paymentIntentId: response.data.paymentIntentId,
        email: me?.email,
        fullName: me?.name,
        ticketId: selectedTicket.id,
        ticketName: selectedTicket.ticketType,
        price: displayPrice,
        quantity,
        currency,
        eventId,
        eventTitle: event?.title,
        eventDate: event?.date,
        eventLocation: event?.location,
        organizationName: event?.organizer,
      }));

      if (!response.data.clientSecret) {
        const params = new URLSearchParams({
          ticketId: selectedTicket.id,
          ticketType: selectedTicket.ticketType,
          qty: String(quantity),
          total: total.toFixed(2),
          currency,
          order: response.data.paymentIntentId,
        });
        if (appliedPromoCode) params.set('promo', appliedPromoCode);
        navigate(`/checkout/${eventId}/success?${params.toString()}`);
        return;
      }

      navigate(`/checkout?paymentIntentId=${response.data.paymentIntentId}`);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t.checkoutReview.startFailed;
      toast.error(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return { isProcessingPayment, handleProceedToPayment };
}
