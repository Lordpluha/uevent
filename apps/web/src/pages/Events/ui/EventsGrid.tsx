import { Link } from 'react-router';
import { SearchX } from 'lucide-react';
import { EventCard, EventCardSkeleton } from '@entities/Event';
import type { EventModel } from '@entities/Event';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@shared/components';
import { useAppContext } from '@shared/lib';

interface Props {
  events: EventModel[];
  isLoading?: boolean;
}

export function EventsGrid({ events, isLoading = false }: Props) {
  const { t } = useAppContext();
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
      <Empty className="py-24">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX className="size-4" />
          </EmptyMedia>
          <EmptyTitle className="text-base">{t.events.noEvents}</EmptyTitle>
          <EmptyDescription className="text-sm">{t.events.noEventsTip}</EmptyDescription>
        </EmptyHeader>
      </Empty>
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
