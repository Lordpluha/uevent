import { Link } from 'react-router';
import { Building2, Ticket } from 'lucide-react';
import { Button, Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useRequiredOrgAccountData } from './useOrgAccountData';

export function OrgEventsSection() {
  const { t } = useAppContext();
  const { orgEvents } = useRequiredOrgAccountData();

  return (
    <section className="mt-5 space-y-3 rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 text-base font-semibold">
        <Building2 className="h-4 w-4 text-primary" />
        {t.orgAccount.eventsSection.title}
      </div>

      <div className="pt-2">
        <p className="mb-2 text-sm font-medium">{t.orgAccount.eventsSection.events}</p>
        {orgEvents.length === 0 ? (
          <Empty className="rounded-lg border border-border/60 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 className="size-4" />
              </EmptyMedia>
              <EmptyDescription className="text-sm">{t.orgAccount.eventsSection.noEvents}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-2">
            {orgEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <Link to={`/events/${event.id}`} className="text-xs text-muted-foreground hover:underline">
                    {t.orgAccount.eventsSection.openEvent}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/events/${event.id}/tickets/create`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Ticket className="h-4 w-4" />
                      {t.orgAccount.eventsSection.addTicket}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
