import type { Route } from './+types/organization-edit';
import { OrgEditPage } from '@pages/OrgEdit';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Edit organization — uevent' }];
}

export default OrgEditPage;
