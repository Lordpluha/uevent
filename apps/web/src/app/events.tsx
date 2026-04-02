import type { Route } from './+types/events';
import { EventsPage } from '@pages/Events';
import { SITE_NAME, SITE_URL } from '@shared/config/app';

export function meta(_: Route.MetaArgs) {
  const title = `Events — ${SITE_NAME}`;
  const description = 'Discover and book upcoming events near you.';
  const url = `${SITE_URL}/events`;
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
  ];
}

export default EventsPage;
