import type { Route } from './+types/organization-profile';
import { OrgAccountPage } from '@pages/OrgAccount';
import { SITE_NAME } from '@shared/config/app';

export function meta(_: Route.MetaArgs) {
  return [
    { title: `Organization account — ${SITE_NAME}` },
    { name: 'description', content: 'Manage your organization profile.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default OrgAccountPage;
