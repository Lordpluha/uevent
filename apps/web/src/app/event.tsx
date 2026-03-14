import type { Route } from './+types/event';
import { EventPage } from '@pages/Event';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Event — uevent' },
    { name: 'description', content: 'Event details and ticket options.' },
  ];
}

export default EventPage;
