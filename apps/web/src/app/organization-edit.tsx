import { OrgEditPage } from '@pages/OrgEdit'
import { SITE_NAME } from '@shared/config/app'
import type { Route } from './+types/organization-edit'

export function meta(_: Route.MetaArgs) {
  return [{ title: `Edit organization — ${SITE_NAME}` }, { name: 'robots', content: 'noindex, nofollow' }]
}

export default OrgEditPage
