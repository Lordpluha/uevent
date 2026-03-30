import { Link } from 'react-router';
import { Building2, Ticket } from 'lucide-react';
import { Button } from '@shared/components';
import type { EventModel } from '@entities/Event';

interface Props {
  orgEvents: EventModel[];
}

export function OrgEventsSection({ orgEvents }: Props) {
  return (
    <section className="mt-5 space-y-3 rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 text-base font-semibold">
        <Building2 className="h-4 w-4 text-primary" />
        Event management
      </div>

      <div className="pt-2">
        <p className="mb-2 text-sm font-medium">Events</p>
        {orgEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet. Create your first event.</p>
        ) : (
          <div className="space-y-2">
            {orgEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <Link to={`/events/${event.id}`} className="text-xs text-muted-foreground hover:underline">
                    Open event
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/events/${event.id}/tickets/create`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Ticket className="h-4 w-4" />
                      Add ticket
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
