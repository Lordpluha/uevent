import { Link } from 'react-router';
import { Ticket as TicketIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, Skeleton } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useProfileViewData } from './useProfileViewData';

export function ProfileTicketsList() {
  const { t } = useAppContext();
  const { myTickets: tickets, ticketsLoading: isLoading } = useProfileViewData();

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
      <Empty className="rounded-xl border border-border/60 py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TicketIcon className="size-4" />
          </EmptyMedia>
          <EmptyDescription className="text-sm">{t.profile.noTickets}</EmptyDescription>
        </EmptyHeader>
      </Empty>
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
