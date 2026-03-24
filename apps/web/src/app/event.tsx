import type { Route } from './+types/event';

import { EventPage } from '@pages/Event';


export function meta({ params }: Route.MetaArgs) {
  // SSR meta не может быть асинхронным, поэтому используем только id
  return [
    { title: `Event — uevent` },
    { name: 'description', content: '' },
  ];
}

export default EventPage;
