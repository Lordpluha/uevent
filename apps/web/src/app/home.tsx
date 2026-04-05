import { HomePage } from '@pages/Home'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@shared/config/app'
import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [
    { title: SITE_NAME },
    { name: 'description', content: SITE_DESCRIPTION },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: SITE_URL },
    { property: 'og:title', content: SITE_NAME },
    { property: 'og:description', content: SITE_DESCRIPTION },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: SITE_NAME },
    { name: 'twitter:description', content: SITE_DESCRIPTION },
    { tagName: 'link', rel: 'canonical', href: SITE_URL },
  ]
}

export default HomePage
