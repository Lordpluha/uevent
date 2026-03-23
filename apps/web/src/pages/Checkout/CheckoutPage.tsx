import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useStripe,
  useElements,
  PaymentElement,
  LinkAuthenticationElement,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import type { StripePaymentElementOptions, StripeElementsOptions } from '@stripe/stripe-js';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@shared/components';
import { api } from '@shared/api';

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [email, setEmail] = useState('');

  // load pending payment details
  useEffect(() => {
    const saved = localStorage.getItem('pendingPayment');
    if(saved) {
      try {
        const payment = JSON.parse(saved);
        setPendingPayment(payment);
        setEmail(payment.email);
      } catch {
        toast.error('Failed to load payment details');
        navigate('/');
      }
    }else {
      toast.error('No payment in progress');
      navigate('/');
    }
  }, [navigate]);

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      if(!stripe || !elements) throw new Error('Stripe not initialized');

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?paymentIntentId=${clientSecret}`,
          receipt_email: email,
        },
        redirect: 'if_required',
      });

      if(result.error) throw result.error;

      return result;
    },
    onSuccess: async (result: any) => {
      if(result?.paymentIntent?.status === 'succeeded' && pendingPayment?.email) {
        try {
          await api.post('/payments/send-confirmation', {
            userEmail: pendingPayment.email,
            userName: pendingPayment.fullName || 'Valued Customer',
            eventTitle: pendingPayment.eventTitle,
            ticketName: pendingPayment.ticketName,
            price: pendingPayment.price,
            eventDate: pendingPayment.eventDate,
            eventLocation: pendingPayment.eventLocation,
            organizationName: pendingPayment.organizationName,
            paymentIntentId: result.paymentIntent.id,
          });
          console.log('Confirmation email sent!');
        } catch(emailError) {
          console.error('⚠️ Email sending failed (payment succeeded but email not sent):', emailError);
        }
      }

      if(result?.paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        localStorage.removeItem('pendingPayment');
        navigate(`/payment-success?paymentIntentId=${result.paymentIntent.id}`);
      }else if(result?.paymentIntent?.status === 'processing') {
        toast.info('Payment is processing...');
        navigate(`/payment-success?paymentIntentId=${result.paymentIntent.id}`);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Payment failed';
      setMessage(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    },
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
      toast.error('Stripe not ready');
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
          Back
        </button>

        {/* Card */}
        <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-2">Secure Checkout</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Complete your payment to confirm ticket purchase
          </p>

          {/* Order Summary */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="space-y-2 mb-3 pb-3 border-b border-border">
              <div className="text-sm">
                <p className="text-muted-foreground">Event</p>
                <p className="font-medium truncate">{pendingPayment?.eventTitle || 'Loading...'}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Ticket Type</p>
                <p className="font-medium">{pendingPayment?.ticketName || 'Loading...'}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-sm font-medium text-muted-foreground">
                Total Amount
              </span>
              <span className="text-2xl font-bold">
                ${pendingPayment?.price ? parseFloat(pendingPayment.price.toString()).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

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
                paymentMethodOrder: ['card', 'google_pay', 'apple_pay'],
              } as StripePaymentElementOptions}
            />

            {/* Errors */}
            {message && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {message}
              </div>
            )}

            {/* Security */}
            <div className="pt-2 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your payment information is encrypted and secure. Stripe handles all transactions
                with industry-standard PCI DSS Level 1 compliance.
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
                Cancel
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
                    Processing...
                  </>
                ) : (
                  `Pay $${(pendingPayment.price || 0).toFixed(2)}`
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if(!publishableKey || publishableKey === 'pk_test_placeholder') {
      console.error('Stripe publishable key is not configured');
      toast.error('Payment configuration error. Please contact support.');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return;
    }
    
    setStripePromise(loadStripe(publishableKey));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('pendingPayment');
    if(saved) 
      {
      try {
        setPendingPayment(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse pending payment:', error);
        toast.error('Failed to load payment details from session');
        
        // redirecting home after fail
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    }
    setLoading(false);
  }, []);

  if(loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if(!pendingPayment?.clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No payment in progress</p>
        </div>
      </div>
    );
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret: pendingPayment.clientSecret,
  };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <CheckoutForm clientSecret={pendingPayment.clientSecret} />
    </Elements>
  );
}
