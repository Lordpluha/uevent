import type { Route } from './+types/events';
import { EventsPage } from '@pages/Events';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Events — uevent' }, { name: 'description', content: 'Discover upcoming events near you.' }];
}

export default EventsPage;
