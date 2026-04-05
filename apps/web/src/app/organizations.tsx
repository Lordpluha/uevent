import { OrgsPage } from '@pages/Organizations'
import { SITE_NAME, SITE_URL } from '@shared/config/app'
import type { Route } from './+types/organizations'

export function meta(_: Route.MetaArgs) {
  const title = `Organizations — ${SITE_NAME}`
  const description = 'Discover communities and groups organizing events.'
  const url = `${SITE_URL}/organizations`
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}

export default OrgsPage
