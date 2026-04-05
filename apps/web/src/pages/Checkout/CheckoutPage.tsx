import { useAppContext } from '@shared/lib'
import { Elements } from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckoutForm } from './CheckoutForm'

type PendingPayment = {
  clientSecret: string
}

export function CheckoutPage() {
  const { t } = useAppContext()
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)

  useEffect(() => {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey || publishableKey === 'pk_test_placeholder') {
      toast.error(t.checkout.configError)
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      return
    }

    setStripePromise(loadStripe(publishableKey))
  }, [t.checkout.configError])

  useEffect(() => {
    const saved = localStorage.getItem('pendingPayment')
    if (saved) {
      try {
        setPendingPayment(JSON.parse(saved))
      } catch (_error) {
        toast.error(t.checkout.loadFailed)

        // redirecting home after fail
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }
    }
    setLoading(false)
  }, [t.checkout.loadFailed])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!pendingPayment?.clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{t.checkout.noPayment}</p>
        </div>
      </div>
    )
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret: pendingPayment.clientSecret,
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <CheckoutForm clientSecret={pendingPayment.clientSecret} />
    </Elements>
  )
}
