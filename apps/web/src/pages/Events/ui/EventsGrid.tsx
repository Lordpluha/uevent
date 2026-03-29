import { Link } from 'react-router';
import { EventCard, EventCardSkeleton } from '@entities/Event';
import type { EventModel } from '@entities/Event';

interface Props {
  events: EventModel[];
  isLoading?: boolean;
}

export function EventsGrid({ events, isLoading = false }: Props) {
  if (isLoading) {
    const skeletonKeys = ['a', 'b', 'c', 'd', 'e', 'f'];
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skeletonKeys.map((key) => (
          <EventCardSkeleton key={`event-skeleton-${key}`} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="text-5xl">🔍</span>
        <p className="text-base font-semibold text-foreground">No events found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Link key={event.id} to={`/events/${event.id}`} className="group block w-full">
          <EventCard
            {...event}
          />
        </Link>
      ))}
    </div>
  );
}
