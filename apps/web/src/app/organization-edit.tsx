import type { Route } from './+types/organization-edit';
import { MOCK_ORGS } from '@shared/mocks/mock-orgs';
import { OrgEditPage } from '@pages/OrgEdit';

export function meta({ params }: Route.MetaArgs) {
  const org = MOCK_ORGS.find((o) => o.id === params.id);
  return [{ title: org ? `Edit ${org.title} — uevent` : 'Edit organization — uevent' }];
}

export default OrgEditPage;
