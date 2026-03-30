import { Link } from 'react-router';
import { Skeleton } from '@shared/components';
import { useAppContext } from '@shared/lib';

export type ProfileTicket = {
  id: string;
  name: string;
  price: number | string;
  status: 'DRAFT' | 'READY' | 'RESERVED' | 'PAID';
  datetime_start?: string;
  event?: {
    id?: string;
    name?: string;
  };
};

interface ProfileTicketsListProps {
  tickets: ProfileTicket[];
  isLoading: boolean;
}

export function ProfileTicketsList({ tickets, isLoading }: ProfileTicketsListProps) {
  const { t } = useAppContext();
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 py-10 text-center">
        <p className="text-3xl">🎟️</p>
        <p className="text-sm text-muted-foreground">{t.profile.noTickets}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <ul className="divide-y divide-border/60">
        {tickets.map((ticket) => {
          const eventName = ticket.event?.name ?? t.profile.eventFallback;
          const eventId = ticket.event?.id;
          const price = Number(ticket.price ?? 0);
          const date = ticket.datetime_start ? new Date(ticket.datetime_start) : null;

          return (
            <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{ticket.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {eventId ? (
                    <Link to={`/events/${eventId}`} className="text-primary hover:underline">
                      {eventName}
                    </Link>
                  ) : (
                    eventName
                  )}
                  {date ? ` • ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-foreground">{price > 0 ? `$${price.toFixed(2)}` : t.common.free}</p>
                <p className="text-xs text-muted-foreground">{ticket.status}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
