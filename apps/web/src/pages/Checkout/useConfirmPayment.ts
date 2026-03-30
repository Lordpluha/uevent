import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { Stripe, StripeElements } from '@stripe/stripe-js';
import { api } from '@shared/api';

interface UseConfirmPaymentOptions {
  stripe: Stripe | null;
  elements: StripeElements | null;
  email: string;
  clientSecret: string;
  pendingPayment: any;
  buildSuccessUrl: (paymentIntentId?: string) => string;
  setMessage: (msg: string | null) => void;
  setIsProcessing: (v: boolean) => void;
}

export function useConfirmPayment({
  stripe,
  elements,
  email,
  clientSecret,
  pendingPayment,
  buildSuccessUrl,
  setMessage,
  setIsProcessing,
}: UseConfirmPaymentOptions) {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      if (!stripe || !elements) throw new Error('Stripe not initialized');

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${buildSuccessUrl(clientSecret)}`,
          receipt_email: email,
        },
        redirect: 'if_required',
      });

      if (result.error) throw result.error;
      return result;
    },
    onSuccess: async (result: any) => {
      const customerEmail = pendingPayment?.email || email;
      if (result?.paymentIntent?.status === 'succeeded' && customerEmail) {
        try {
          await api.post('/payments/send-confirmation', {
            userEmail: customerEmail,
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
        } catch (emailError) {
          console.error('⚠️ Email sending failed (payment succeeded but email not sent):', emailError);
        }
      }

      if (result?.paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        navigate(buildSuccessUrl(result.paymentIntent.id));
      } else if (result?.paymentIntent?.status === 'processing') {
        toast.info('Payment is processing...');
        navigate(buildSuccessUrl(result.paymentIntent.id));
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Payment failed';
      setMessage(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);

      setTimeout(() => {
        const reason = encodeURIComponent(errorMessage);
        navigate(`/payment-failed?paymentIntentId=${clientSecret}&reason=${reason}`);
      }, 2000);
    },
  });
}
