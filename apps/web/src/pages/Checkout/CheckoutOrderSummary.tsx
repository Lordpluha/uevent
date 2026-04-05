import { useAppContext } from '@shared/lib'

interface CheckoutOrderSummaryProps {
  eventTitle?: string
  ticketName?: string
  price?: number | string
  currency?: string
}

export function CheckoutOrderSummary({ eventTitle, ticketName, price, currency = '$' }: CheckoutOrderSummaryProps) {
  const { t } = useAppContext()
  return (
    <div className="mb-6 p-4 bg-muted rounded-lg">
      <div className="space-y-2 mb-3 pb-3 border-b border-border">
        <div className="text-sm">
          <p className="text-muted-foreground">{t.checkout.event}</p>
          <p className="font-medium truncate">{eventTitle || t.common.loading}</p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">{t.checkout.ticketType}</p>
          <p className="font-medium">{ticketName || t.common.loading}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-3">
        <span className="text-sm font-medium text-muted-foreground">{t.checkout.totalAmount}</span>
        <span className="text-2xl font-bold">
          {currency}
          {price ? Number.parseFloat(price.toString()).toFixed(2) : '0.00'}
        </span>
      </div>
    </div>
  )
}
