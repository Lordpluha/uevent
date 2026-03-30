interface CheckoutOrderSummaryProps {
  eventTitle?: string;
  ticketName?: string;
  price?: number | string;
}

export function CheckoutOrderSummary({ eventTitle, ticketName, price }: CheckoutOrderSummaryProps) {
  return (
    <div className="mb-6 p-4 bg-muted rounded-lg">
      <div className="space-y-2 mb-3 pb-3 border-b border-border">
        <div className="text-sm">
          <p className="text-muted-foreground">Event</p>
          <p className="font-medium truncate">{eventTitle || 'Loading...'}</p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Ticket Type</p>
          <p className="font-medium">{ticketName || 'Loading...'}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-3">
        <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
        <span className="text-2xl font-bold">
          ${price ? Number.parseFloat(price.toString()).toFixed(2) : '0.00'}
        </span>
      </div>
    </div>
  );
}
