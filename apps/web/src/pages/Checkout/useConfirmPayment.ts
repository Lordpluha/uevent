import { useAppContext } from '@shared/lib'
import type { PaymentIntentResult, Stripe, StripeElements } from '@stripe/stripe-js'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

interface UseConfirmPaymentOptions {
  stripe: Stripe | null
  elements: StripeElements | null
  email: string
  clientSecret: string
  buildSuccessUrl: (paymentIntentId?: string) => string
  setMessage: (msg: string | null) => void
  setIsProcessing: (v: boolean) => void
}

export function useConfirmPayment({
  stripe,
  elements,
  email,
  clientSecret,
  buildSuccessUrl,
  setMessage,
  setIsProcessing,
}: UseConfirmPaymentOptions) {
  const navigate = useNavigate()
  const { t } = useAppContext()

  return useMutation({
    mutationFn: async () => {
      if (!stripe || !elements) throw new Error('Stripe not initialized')

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${buildSuccessUrl(clientSecret)}`,
          receipt_email: email,
        },
        redirect: 'if_required',
      })

      if (result.error) throw result.error
      return result
    },
    onSuccess: async (result: PaymentIntentResult) => {
      if (result?.paymentIntent?.status === 'succeeded') {
        toast.success(t.checkout.paymentSuccess)
        navigate(buildSuccessUrl(result.paymentIntent.id))
      } else if (result?.paymentIntent?.status === 'processing') {
        toast.info(t.checkout.paymentProcessing)
        navigate(buildSuccessUrl(result.paymentIntent.id))
      }
    },
    onError: (error: unknown) => {
      const stripeError = error as { type?: string; payment_intent?: unknown }
      const isValidationError = stripeError?.type === 'validation_error'
      const errorMessage =
        (isAxiosError(error) ? error.response?.data?.message : undefined) ||
        (error instanceof Error ? error.message : undefined) ||
        t.checkout.paymentFailed
      setMessage(errorMessage)
      setIsProcessing(false)

      if (!isValidationError) {
        toast.error(errorMessage)
        // Only navigate to failed page for real payment failures, not input validation
        if (stripeError?.payment_intent) {
          setTimeout(() => {
            const reason = encodeURIComponent(errorMessage)
            navigate(`/payment-failed?paymentIntentId=${clientSecret}&reason=${reason}`)
          }, 2000)
        }
      }
    },
  })
}
