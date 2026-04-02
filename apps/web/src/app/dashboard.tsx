import { OrgAccountPage } from '@pages/OrgAccount';
import { SITE_NAME } from '@shared/config/app';

export function meta() {
  return [
    { title: `Dashboard — ${SITE_NAME}` },
    { name: 'description', content: 'Organization dashboard.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default OrgAccountPage;
