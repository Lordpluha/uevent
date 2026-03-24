import type { Route } from './+types/organization';
import { OrgProfilePage } from '@pages/OrgProfile';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Organization — uevent' },
    { name: 'description', content: 'Organization profile and events.' },
  ];
}

export default OrgProfilePage;
