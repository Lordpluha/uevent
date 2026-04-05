import { EventCreatePage } from '@pages/EventCreate'
import { SITE_NAME } from '@shared/config/app'
import type { Route } from './+types/event-create'

export function meta(_: Route.MetaArgs) {
  return [
    { title: `Create event — ${SITE_NAME}` },
    { name: 'description', content: 'Create a new event as organizer.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ]
}

export default EventCreatePage
