import type { Route } from './+types/ticket-create';
import { TicketCreatePage } from '@pages/TicketCreate';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Create ticket — uevent' },
    { name: 'description', content: 'Configure ticket options for an event.' },
  ];
}

export default TicketCreatePage;
