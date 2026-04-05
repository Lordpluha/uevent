import { OrgEditPage } from '@pages/OrgEdit'
import { SITE_NAME } from '@shared/config/app'

export function meta() {
  return [
    { title: `Settings — ${SITE_NAME}` },
    { name: 'description', content: 'Organization settings.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ]
}

export default OrgEditPage
