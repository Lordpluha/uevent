import { useAppContext } from '@shared/lib';

interface CheckoutOrderSummaryProps {
  eventTitle?: string;
  ticketName?: string;
  price?: number | string;
  platformFee?: number;
}

export function CheckoutOrderSummary({ eventTitle, ticketName, price, platformFee = 1.0 }: CheckoutOrderSummaryProps) {
  const { t } = useAppContext();
  const priceNum = price ? Number.parseFloat(price.toString()) : 0;
  const total = priceNum + platformFee;
  
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
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.checkout.ticketPrice || 'Ticket Price'}</span>
          <span>${priceNum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.checkout.platformFee || 'Platform Fee'}</span>
          <span>${platformFee.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-border">
        <span className="text-sm font-medium text-muted-foreground">{t.checkout.totalAmount}</span>
        <span className="text-2xl font-bold">
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
