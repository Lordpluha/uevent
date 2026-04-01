import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import type { PaymentIntentResult, Stripe, StripeElements } from '@stripe/stripe-js';
import { api } from '@shared/api';
import { useAppContext } from '@shared/lib';

type PendingPayment = {
  email?: string;
  fullName?: string;
  eventTitle?: string;
  ticketName?: string;
  price?: number;
  eventDate?: string;
  eventLocation?: string;
  organizationName?: string;
};

interface UseConfirmPaymentOptions {
  stripe: Stripe | null;
  elements: StripeElements | null;
  email: string;
  clientSecret: string;
  pendingPayment: PendingPayment | null;
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
  const { t } = useAppContext();

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
    onSuccess: async (result: PaymentIntentResult) => {
      const customerEmail = pendingPayment?.email || email;
      if (result?.paymentIntent?.status === 'succeeded' && customerEmail) {
        try {
          await api.post('/payments/send-confirmation', {
            userEmail: customerEmail,
            userName: pendingPayment?.fullName || t.checkout.defaultName,
            eventTitle: pendingPayment?.eventTitle,
            ticketName: pendingPayment?.ticketName,
            price: pendingPayment?.price,
            eventDate: pendingPayment?.eventDate,
            eventLocation: pendingPayment?.eventLocation,
            organizationName: pendingPayment?.organizationName,
            paymentIntentId: result.paymentIntent.id,
          });
          console.log('Confirmation email sent!');
        } catch (emailError) {
          console.error('⚠️ Email sending failed (payment succeeded but email not sent):', emailError);
        }
      }

      if (result?.paymentIntent?.status === 'succeeded') {
        toast.success(t.checkout.paymentSuccess);
        navigate(buildSuccessUrl(result.paymentIntent.id));
      } else if (result?.paymentIntent?.status === 'processing') {
        toast.info(t.checkout.paymentProcessing);
        navigate(buildSuccessUrl(result.paymentIntent.id));
      }
    },
    onError: (error: unknown) => {
      const errorMessage =
        (isAxiosError(error) ? error.response?.data?.message : undefined) ||
        (error instanceof Error ? error.message : undefined) ||
        t.checkout.paymentFailed;
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
