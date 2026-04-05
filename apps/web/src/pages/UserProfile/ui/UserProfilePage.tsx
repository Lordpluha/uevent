import { EventCard, useEvents } from '@entities/Event'
import { useUser } from '@entities/User'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  JsonLd,
  Separator,
} from '@shared/components'
import { ShareButton } from '@shared/components/ShareButton/ShareButton'
import { SITE_URL } from '@shared/config/app'
import { useAppContext } from '@shared/lib'
import { CalendarDays, ChevronLeft, Globe, MapPin, Star, UserRoundX } from 'lucide-react'
import { Link, useParams } from 'react-router'

export function UserProfilePage() {
  const { t } = useAppContext()
  const { id } = useParams()
  const { data: user, isLoading, isError } = useUser(id ?? '')
  const { data: userEventsResult } = useEvents({ page: 1, limit: 3 })
  const userEvents = userEventsResult?.data ?? []

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.userProfile.loading}</p>
      </main>
    )
  }

  if (!user || isError) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <Empty className="max-w-md border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundX className="size-4" />
            </EmptyMedia>
            <EmptyTitle className="text-base">{t.userProfile.notFound}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/" className="text-sm text-primary hover:underline">
              {t.userProfile.backToHome}
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          '@id': `${SITE_URL}/users/${user.id}`,
          name: user.name,
          alternateName: user.username,
          url: `${SITE_URL}/users/${user.id}`,
          ...(user.avatarUrl ? { image: user.avatarUrl } : {}),
          ...(user.bio ? { description: user.bio } : {}),
          ...(user.location ? { homeLocation: { '@type': 'Place', name: user.location } } : {}),
          ...(user.website ? { sameAs: [user.website] } : {}),
        }}
      />
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.userProfile.back}
      </Link>

      <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary/20">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <ShareButton
            title={t.userProfile.onUevent.replace('{{name}}', user.name)}
            variant="default"
            className="mt-2"
          />
          {user.bio && <p className="mt-2 max-w-md text-sm text-muted-foreground">{user.bio}</p>}
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground sm:justify-start">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {t.userProfile.joined.replace('{{date}}', user.joinedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t.userProfile.eventsAttended, value: user.eventsAttended },
          { label: t.userProfile.tickets, value: user.ticketsCount },
          { label: t.userProfile.followers, value: user.followers },
          { label: t.userProfile.following, value: user.following },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card py-4">
            <span className="text-2xl font-extrabold text-primary">{value.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold">{t.userProfile.interests}</h2>
        <div className="flex flex-wrap gap-2">
          {user.interests.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      <Separator className="mb-8" />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.userProfile.recentEvents}</h2>
          <Link to="/events" className="flex items-center gap-1 text-xs text-primary hover:underline">
            {t.userProfile.seeAll} <Star className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-4">
          {userEvents.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="shrink-0">
              <EventCard {...event} size="compact" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
