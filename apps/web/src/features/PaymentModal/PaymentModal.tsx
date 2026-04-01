import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import { api } from '@shared/api';
import { Button } from '@shared/components';
import { DEFAULT_PAYMENT_CURRENCY_CODE, DEFAULT_PAYMENT_CURRENCY_SYMBOL } from '@shared/config/payment';
import { useAppContext } from '@shared/lib';

export interface PaymentModalProps {
  ticketId: number;
  ticketName: string;
  price: number;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  organizationName?: string;
  onClose: () => void;
  onSuccess?: (paymentIntentId: string) => void;
}

export function PaymentModal({
  ticketId,
  ticketName,
  price,
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  organizationName,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { t } = useAppContext();
  const [email, setEmail] = useState('');
  const [cardName, setCardName] = useState('');

  // convert price to cents
  const amountInCents = Math.round(price * 100);

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<{
        clientSecret: string;
        paymentIntentId: string;
      }>('/payments/create-intent', {
        amount: amountInCents,
        currency: DEFAULT_PAYMENT_CURRENCY_CODE,
        orderId: `ticket-${ticketId}-event-${eventId}`,
        userEmail: email,
        userName: cardName,
        eventTitle,
        ticketName,
        eventDate,
        eventLocation,
        organizationName,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t.paymentModal.intentCreated);
      // store payment details
      localStorage.setItem('pendingPayment', JSON.stringify({
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        email,
        fullName: cardName,
        ticketId,
        ticketName,
        price,
        eventId,
        eventTitle,
        eventDate,
        eventLocation,
        organizationName,
      }));
      onSuccess?.(data.paymentIntentId);
      onClose();
      window.location.href = `/checkout?paymentIntentId=${data.paymentIntentId}`;
    },
    onError: (error: unknown) => {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined;
      toast.error(message || t.paymentModal.createFailed);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!email || !cardName) {
      toast.error(t.paymentModal.fillFields);
      return;
    }
    createPaymentMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-xl font-bold">{t.paymentModal.title}</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {eventTitle} • {ticketName}
        </p>

        <div className="mb-6 rounded-lg bg-muted p-4">
          <div className="flex justify-between text-sm">
            <span>{t.paymentModal.ticketPrice}</span>
            <span className="font-semibold">
              {DEFAULT_PAYMENT_CURRENCY_SYMBOL}{price.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-bold">
            <span>{t.paymentModal.total}</span>
            <span>
              ${price.toFixed(2)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="payment-modal-full-name" className="block text-sm font-medium text-foreground mb-1">
              {t.paymentModal.fullName}
            </label>
            <input
              id="payment-modal-full-name"
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder={t.paymentModal.fullNamePlaceholder}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="payment-modal-email" className="block text-sm font-medium text-foreground mb-1">
              {t.common.email}
            </label>
            <input
              id="payment-modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.paymentModal.emailPlaceholder}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-4">
              {t.paymentModal.secureNote}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createPaymentMutation.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={createPaymentMutation.isPending}
              className="flex-1"
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.common.processing}
                </>
              ) : (
                t.paymentModal.pay.replace('{{amount}}', `$${price.toFixed(2)}`)
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
