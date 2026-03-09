import { Link, useParams } from 'react-router';
import { BadgeCheck, CalendarDays, ChevronLeft, Globe, MapPin, Users } from 'lucide-react';
import { EventCard } from '@entities/Event';
import { Avatar, AvatarFallback, AvatarImage, Badge, Separator } from '@shared/components';
import { MOCK_EVENTS } from '@shared/mocks/mock-events';
import { MOCK_ORGS } from '@shared/mocks/mock-orgs';

export function OrgProfilePage() {
  const { id } = useParams();
  const org = MOCK_ORGS.find((o) => o.id === id);

  if (!org) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">🏢</p>
        <h1 className="text-xl font-semibold">Organization not found</h1>
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </Link>
      </main>
    );
  }

  const orgEvents = MOCK_EVENTS.filter((e) => e.organizer === org.title).slice(0, 4);
  const featuredEvents = orgEvents.length > 0 ? orgEvents : MOCK_EVENTS.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Cover */}
      {org.coverUrl && (
        <div className="relative mb-0 h-48 w-full overflow-hidden rounded-2xl bg-muted sm:h-60">
          <img src={org.coverUrl} alt={org.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-end ${org.coverUrl ? '-mt-12 px-4' : ''}`}>
        <Avatar className="h-24 w-24 rounded-2xl border-4 border-background ring-2 ring-primary/20">
          <AvatarImage src={org.avatarUrl} alt={org.title} />
          <AvatarFallback className="rounded-2xl text-2xl">{org.title[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{org.title}</h1>
            {org.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
            <Badge variant="secondary">{org.category}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {org.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {org.location}
              </span>
            )}
            {org.website && (
              <a
                href={org.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {org.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Founded {org.foundedAt}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {org.description && (
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">{org.description}</p>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { label: 'Members', value: org.membersCount, icon: Users },
          { label: 'Events', value: org.eventsCount, icon: CalendarDays },
          { label: 'Followers', value: org.followers, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card py-4">
            <Icon className="mb-1 h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-extrabold text-primary">{value.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <Separator className="mb-8" />

      {/* Events */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Events by {org.title}</h2>
        <div className="flex flex-wrap gap-4">
          {featuredEvents.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="shrink-0">
              <EventCard {...event} size="compact" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
