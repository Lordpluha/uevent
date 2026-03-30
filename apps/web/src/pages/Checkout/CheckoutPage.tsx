import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
import { CheckoutForm } from './CheckoutForm';

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
