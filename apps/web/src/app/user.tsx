import { mapApiUser, usersApi } from '@entities/User'
import { UserProfilePage } from '@pages/UserProfile'
import { SITE_NAME, SITE_URL } from '@shared/config/app'
import type { Route } from './+types/user'

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const raw = await usersApi.getOne(params.id ?? '')
    const user = mapApiUser(raw)
    return { user }
  } catch {
    return { user: null }
  }
}

export function meta({ data }: Route.MetaArgs) {
  const user = data?.user
  if (!user) {
    return [{ title: `User — ${SITE_NAME}` }]
  }

  const title = `${user.name} (@${user.username}) — ${SITE_NAME}`
  const description = user.bio
    ? user.bio.slice(0, 160)
    : `${user.eventsAttended} events attended · ${user.followers} followers`
  const url = `${SITE_URL}/users/${user.id}`

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'profile' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    ...(user.avatarUrl ? [{ property: 'og:image', content: user.avatarUrl }] : []),
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    ...(user.avatarUrl ? [{ name: 'twitter:image', content: user.avatarUrl }] : []),
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}

export default UserProfilePage
