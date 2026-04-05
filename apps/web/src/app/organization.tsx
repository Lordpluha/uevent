import { mapApiOrganization, organizationsApi } from '@entities/Organization'
import { OrgProfilePage } from '@pages/OrgProfile'
import { SITE_NAME, SITE_URL } from '@shared/config/app'
import type { Route } from './+types/organization'

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const raw = await organizationsApi.getOne(params.id ?? '')
    const org = mapApiOrganization(raw)
    return { org }
  } catch {
    return { org: null }
  }
}

export function meta({ data }: Route.MetaArgs) {
  const org = data?.org
  if (!org) {
    return [{ title: `Organization — ${SITE_NAME}` }, { name: 'description', content: '' }]
  }

  const title = `${org.title} — ${SITE_NAME}`
  const description = org.description
    ? org.description.slice(0, 160)
    : `${org.category} · ${org.eventsCount} events · ${org.followers} followers`
  const image = org.coverUrl ?? org.avatarUrl
  const url = `${SITE_URL}/organizations/${org.id}`

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    ...(image ? [{ property: 'og:image', content: image }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    ...(image ? [{ name: 'twitter:image', content: image }] : []),
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}

export default OrgProfilePage
