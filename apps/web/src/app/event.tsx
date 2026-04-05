import { eventsApi, mapApiEvent } from '@entities/Event'
import { EventPage } from '@pages/Event'
import { SITE_NAME, SITE_URL } from '@shared/config/app'
import type { Route } from './+types/event'

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const raw = await eventsApi.getOne(params.id ?? '')
    const event = mapApiEvent(raw)
    return { event }
  } catch {
    return { event: null }
  }
}

export function meta({ data }: Route.MetaArgs) {
  const event = data?.event
  if (!event) {
    return [{ title: `Event — ${SITE_NAME}` }, { name: 'description', content: '' }]
  }

  const title = `${event.title} — ${SITE_NAME}`
  const description = event.description
    ? event.description.replace(/<[^>]+>/g, '').slice(0, 160)
    : `${event.date} · ${event.format === 'online' ? 'Online' : (event.location ?? 'Offline')}`
  const image = event.imageUrl
  const url = `${SITE_URL}/events/${event.id}`

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

export default EventPage
