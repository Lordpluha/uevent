import { Link, useParams, useSearchParams } from 'react-router';
import { CheckCircle2, Download, Ticket } from 'lucide-react';
import { Badge, Button } from '@shared/components';

export function CheckoutSuccessPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();

  const ticketType = searchParams.get('ticketType') ?? 'standard';
  const quantity = Number(searchParams.get('qty') ?? '1');
  const promo = searchParams.get('promo') ?? '';
  const total = Number(searchParams.get('total') ?? '0');
  const currency = searchParams.get('currency') ?? '$';
  const orderId = searchParams.get('order') ?? 'DEMO-0001';

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Payment successful</h1>
            <p className="text-sm text-muted-foreground">Your ticket reservation is confirmed.</p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="font-semibold text-foreground">{orderId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Event ID</p>
            <p className="font-semibold text-foreground">{eventId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ticket type</p>
            <p className="font-semibold capitalize text-foreground">{ticketType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="font-semibold text-foreground">{Number.isFinite(quantity) ? quantity : 1}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total paid</p>
            <p className="font-semibold text-foreground">{currency}{Number.isFinite(total) ? total.toFixed(2) : '0.00'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Promo code</p>
            {promo ? <Badge variant="secondary">{promo}</Badge> : <p className="font-semibold text-foreground">None</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="gap-1.5" variant="outline" disabled>
            <Download className="h-4 w-4" />
            Download ticket (soon)
          </Button>
          <Link to={eventId ? `/events/${eventId}` : '/events'}>
            <Button className="gap-1.5">
              <Ticket className="h-4 w-4" />
              Back to event
            </Button>
          </Link>
          <Link to="/events" className="self-center text-sm text-primary hover:underline">
            Discover more events
          </Link>
        </div>
      </section>
    </main>
  );
}
