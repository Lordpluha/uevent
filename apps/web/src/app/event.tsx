import type { Route } from './+types/event';
import { MOCK_EVENTS } from '@shared/mocks/mock-events';
import { EventPage } from '@pages/Event';

export function meta({ params }: Route.MetaArgs) {
  const event = MOCK_EVENTS.find((e) => e.id === params.id);
  return [
    { title: event ? `${event.title} — uevent` : 'Event — uevent' },
    { name: 'description', content: event?.description ?? '' },
  ];
}

export default EventPage;
