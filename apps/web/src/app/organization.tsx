import type { Route } from './+types/organization';
import { MOCK_ORGS } from '@shared/mocks/mock-orgs';
import { OrgProfilePage } from '@pages/OrgProfile';

export function meta({ params }: Route.MetaArgs) {
  const org = MOCK_ORGS.find((o) => o.id === params.id);
  return [
    { title: org ? `${org.title} — uevent` : 'Organization — uevent' },
    { name: 'description', content: org?.description ?? '' },
  ];
}

export default OrgProfilePage;
