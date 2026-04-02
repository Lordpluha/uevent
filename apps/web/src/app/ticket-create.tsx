import type { Route } from './+types/ticket-create';
import { TicketCreatePage } from '@pages/TicketCreate';
import { SITE_NAME } from '@shared/config/app';

export function meta(_: Route.MetaArgs) {
  return [
    { title: `Create ticket — ${SITE_NAME}` },
    { name: 'description', content: 'Configure ticket options for an event.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default TicketCreatePage;
