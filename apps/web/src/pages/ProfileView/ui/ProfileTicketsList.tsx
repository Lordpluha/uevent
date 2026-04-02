import { Link } from 'react-router';
import { Download, Ticket as TicketIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, Skeleton } from '@shared/components';
import { cn } from '@shared/lib/utils';
import { useAppContext } from '@shared/lib';
import { api } from '@shared/api';
import { toast } from 'sonner';
import { useProfileViewData } from './useProfileViewData';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  used: 'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500',
};

function statusStyle(status: string): string {
  return STATUS_STYLES[status?.toLowerCase()] ?? 'bg-muted text-muted-foreground';
}

export function ProfileTicketsList() {
  const { t } = useAppContext();
  const { myTickets: tickets, ticketsLoading: isLoading } = useProfileViewData();

  const handleDownload = async (ticketId: string, ticketName: string) => {
    try {
      const response = await api.get<Blob>(`/payments/ticket/${ticketId}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `uevent-ticket-${ticketName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download ticket');
    }
  };

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

              <div className="flex items-center gap-3">
                {ticket.status?.toLowerCase() === 'paid' && (
                  <button
                    type="button"
                    onClick={() => void handleDownload(ticket.id, ticket.name)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    title={t.profile.downloadTicket}
                  >
                    <Download className="size-3.5" />
                    {t.profile.downloadTicket}
                  </button>
                )}
                <div className="text-right">
                  <p className="font-semibold text-foreground">{price > 0 ? `$${price.toFixed(2)}` : t.common.free}</p>
                  <span
                    className={cn(
                      'mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                      statusStyle(ticket.status),
                    )}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
