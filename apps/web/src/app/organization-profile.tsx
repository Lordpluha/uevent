import type { Route } from './+types/organization-profile';
import { OrgAccountPage } from '@pages/OrgAccount';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Organization account — uevent' },
    { name: 'description', content: 'Manage personal organization profile.' },
  ];
}

export default OrgAccountPage;
