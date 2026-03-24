import type { Route } from './+types/event-create';
import { EventCreatePage } from '@pages/EventCreate';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Create event — uevent' },
    { name: 'description', content: 'Create a new event as organizer.' },
  ];
}

export default EventCreatePage;
