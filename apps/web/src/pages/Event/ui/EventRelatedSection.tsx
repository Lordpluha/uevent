import { Link } from 'react-router';
import { EventCard } from '@entities/Event';
import type { EventModel } from '@entities/Event';
import { useAppContext } from '@shared/lib';

interface Props {
  organizerEvents: EventModel[];
  similarEvents: EventModel[];
}

export function EventRelatedSection({ organizerEvents, similarEvents }: Props) {
  const { t } = useAppContext();
  return (
    <>
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{t.events.related.byOrganizer}</h2>
          {organizerEvents.length > 0 && (
            <Link to="/events" className="text-xs text-primary hover:underline">{t.common.seeAll}</Link>
          )}
        </div>
        {organizerEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.events.related.noByOrganizer}</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {organizerEvents.map((item) => (
              <Link key={item.id} to={`/events/${item.id}`} className="shrink-0">
                <EventCard {...item} size="compact" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{t.events.related.similar}</h2>
          {similarEvents.length > 0 && (
            <Link to="/events" className="text-xs text-primary hover:underline">{t.events.related.discoverMore}</Link>
          )}
        </div>
        {similarEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.events.related.noSimilar}</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {similarEvents.map((item) => (
              <Link key={item.id} to={`/events/${item.id}`} className="shrink-0">
                <EventCard {...item} size="compact" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
