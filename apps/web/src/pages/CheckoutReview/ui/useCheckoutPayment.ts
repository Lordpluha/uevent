import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '@shared/api';

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
  quantity: number;
  remaining?: number;
  currency: string;
  appliedPromoCode?: string;
  me?: { email?: string; name?: string } | null;
  event?: { title?: string; date?: string; time?: string; location?: string; organizer?: string } | null;
}

export function useCheckoutPayment({
  eventId,
  selectedTicket,
  total,
  quantity,
  remaining,
  currency,
  appliedPromoCode,
  me,
  event,
}: UseCheckoutPaymentOptions) {
  const navigate = useNavigate();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleProceedToPayment = async () => {
    if (!eventId || !selectedTicket) return;
    if (selectedTicket.quantityLimited && (remaining ?? 0) <= 0) {
      toast.error('This ticket is sold out');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const orderId = `ticket-${selectedTicket.id}-event-${eventId}-${Date.now()}`;
      const amountInCents = Math.round(total * 100);

      if (amountInCents <= 0) {
        const params = new URLSearchParams({
          ticketId: selectedTicket.id,
          ticketType: selectedTicket.ticketType,
          qty: String(quantity),
          total: total.toFixed(2),
          currency,
          order: orderId,
        });
        if (appliedPromoCode) params.set('promo', appliedPromoCode);
        navigate(`/checkout/${eventId}/success?${params.toString()}`);
        return;
      }

      const response = await api.post<{ clientSecret: string; paymentIntentId: string }>('/payments/create-intent', {
        amount: amountInCents,
        currency: 'usd',
        orderId,
        ticketId: selectedTicket.id,
        quantity,
        userEmail: me?.email,
        userName: me?.name,
        eventTitle: event?.title,
        ticketName: selectedTicket.ticketType,
        eventDate: event?.date,
        eventLocation: event?.location,
        organizationName: event?.organizer,
      });

      localStorage.setItem('pendingPayment', JSON.stringify({
        clientSecret: response.data.clientSecret,
        paymentIntentId: response.data.paymentIntentId,
        email: me?.email,
        fullName: me?.name,
        ticketId: selectedTicket.id,
        ticketName: selectedTicket.ticketType,
        price: total,
        quantity,
        eventId,
        eventTitle: event?.title,
        eventDate: event?.date,
        eventLocation: event?.location,
        organizationName: event?.organizer,
      }));

      navigate(`/checkout?paymentIntentId=${response.data.paymentIntentId}`);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to start payment';
      toast.error(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return { isProcessingPayment, handleProceedToPayment };
}
