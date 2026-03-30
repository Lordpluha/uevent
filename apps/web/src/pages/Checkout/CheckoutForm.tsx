import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  useStripe,
  useElements,
  PaymentElement,
  LinkAuthenticationElement,
} from '@stripe/react-stripe-js';
import type { StripePaymentElementOptions } from '@stripe/stripe-js';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { CheckoutOrderSummary } from './CheckoutOrderSummary';
import { useConfirmPayment } from './useConfirmPayment';

export function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const { t } = useAppContext();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [email, setEmail] = useState('');

  const buildSuccessUrl = (paymentIntentId?: string) => {
    const eventId = pendingPayment?.eventId;
    if (!eventId) return `/payment-success?paymentIntentId=${paymentIntentId ?? clientSecret}`;

    const params = new URLSearchParams({
      ticketId: pendingPayment?.ticketId ?? '',
      ticketType: pendingPayment?.ticketName ?? 'standard',
      qty: String(pendingPayment?.quantity ?? 1),
      total: String(Number(pendingPayment?.price ?? 0).toFixed(2)),
      currency: '$',
      order: pendingPayment?.paymentIntentId ?? paymentIntentId ?? clientSecret,
    });

    return `/checkout/${eventId}/success?${params.toString()}`;
  };

  // load pending payment details
  useEffect(() => {
    const saved = localStorage.getItem('pendingPayment');
    if(saved) {
      try {
        const payment = JSON.parse(saved);
        setPendingPayment(payment);
        setEmail(payment.email);
      } catch {
        toast.error(t.checkout.loadFailed);
        navigate('/');
      }
    }else {
      toast.error(t.checkout.noPayment);
      navigate('/');
    }
  }, [navigate]);

  const confirmPaymentMutation = useConfirmPayment({
    stripe,
    elements,
    email,
    clientSecret,
    pendingPayment,
    buildSuccessUrl,
    setMessage,
    setIsProcessing,
  });

  if(!pendingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!stripe || !elements) {
      toast.error(t.checkout.stripeNotReady);
      return;
    }
    setIsProcessing(true);
    confirmPaymentMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 py-12 px-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.checkout.back}
        </button>

        {/* Card */}
        <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-2">{t.checkout.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t.checkout.subtitle}
          </p>

          <CheckoutOrderSummary
            eventTitle={pendingPayment?.eventTitle}
            ticketName={pendingPayment?.ticketName}
            price={pendingPayment?.price}
          />

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <LinkAuthenticationElement
              onChange={(e) => {
                if(e.value?.email) setEmail(e.value.email);
              }}
            />

            {/* Payment Element */}
            <PaymentElement
              options={{
                layout: 'tabs',
                wallets: {
                  googlePay: 'auto',
                  applePay: 'auto',
                },
                business: {
                  name: 'UEVENT',
                },
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'cashapp', 'paypal', 'klarna', 'affirm'],
                terms: {
                  bancontact: 'auto',
                  card: 'auto',
                  ideal: 'auto',
                  sepa_debit: 'auto',
                  sofort: 'auto',
                },
              } as StripePaymentElementOptions}
            />

            {/* Errors */}
            {message && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {message}
              </div>
            )}

            {/* Security */}
            <div className="pt-2 pb-4 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                🔒 {t.checkout.secureNote}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                💳 {t.checkout.redirectNote}
              </p>
            </div>

            {/* Btns */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('pendingPayment');
                  navigate(-1);
                }}
                disabled={isProcessing || confirmPaymentMutation.isPending}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={
                  !stripe || !elements || isProcessing || confirmPaymentMutation.isPending
                }
                className="flex-1"
              >
                {isProcessing || confirmPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.common.processing}
                  </>
                ) : (
                  t.checkout.pay.replace('{{amount}}', `$${(pendingPayment.price || 0).toFixed(2)}`)
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
