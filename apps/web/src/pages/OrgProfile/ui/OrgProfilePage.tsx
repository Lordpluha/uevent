import { Link, useParams } from 'react-router';
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  Globe,
  Heart,
  MapPin,
  Users,
} from 'lucide-react';

import { useOrg } from '@entities/Organization';
import { useEvents } from '@entities/Event';
import { EventCard } from '@entities/Event';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Separator,
} from '@shared/components';

export function OrgProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading } = useOrg(id ?? '');
  const { data: orgEvents = [] } = useEvents(
    org ? { organization_id: Number(org.id) } : undefined,
  );
  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!org) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">🏢</p>
        <h1 className="text-xl font-semibold">Organization not found</h1>
        <Link to="/organizations" className="text-sm text-primary hover:underline">
          ← Back to organizations
        </Link>
      </main>
    );
  }

  const displayEvents = orgEvents.length > 0 ? orgEvents : [];

  return (
    <main className="w-full pb-16">
      {/* ── Hero cover — full viewport width ────────────────────── */}
      <div className="relative h-52 w-full overflow-hidden bg-muted sm:h-64">
        {org.coverUrl ? (
          <img
            src={org.coverUrl}
            alt={org.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />

        <Link
          to="/organizations"
          className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/50 sm:left-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Organizations
        </Link>
      </div>

      {/* ── Content — max-width constrained, pulled up over cover ── */}
      <div className="relative z-10 mx-auto w-full max-w-5xl -mt-12 px-4 sm:px-6">
        {/* ── Avatar + name row ──────────────────────────────────── */}
        <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 shrink-0 rounded-full shadow-lg">
              <AvatarImage src={org.avatarUrl} alt={org.title} />
              <AvatarFallback className="rounded-full text-2xl font-bold">
                {org.title[0]}
              </AvatarFallback>
            </Avatar>

            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {org.title}
                </h1>
                {org.verified && (
                  <BadgeCheck className="h-6 w-6 shrink-0 text-primary" />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{org.category}</Badge>
                {org.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {org.location}
                  </span>
                )}
              </div>
            </div>
        </div>

        {/* ── Meta links ───────────────────────────────────────── */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {org.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <Globe className="h-3.5 w-3.5" />
              {org.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Founded {org.foundedAt}
          </span>
        </div>

        {/* ── Description ──────────────────────────────────────── */}
        {org.description && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {org.description}
          </p>
        )}

        {/* ── Stats ────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
          {[
            { label: 'Members', value: org.membersCount, icon: Users },
            { label: 'Events', value: org.eventsCount, icon: CalendarDays },
            { label: 'Followers', value: org.followers, icon: Heart },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card py-4"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-extrabold text-foreground">
                {value.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* ── Events section ───────────────────────────────────── */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Events by {org.title}
            </h2>
            {displayEvents.length > 0 && (
              <Link
                to={`/events?organizationId=${org.id}`}
                className="text-xs text-primary hover:underline"
              >
                See all
              </Link>
            )}
          </div>

          {displayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-card py-16 text-center">
              <span className="text-4xl">📅</span>
              <p className="text-sm font-medium text-foreground">No events yet</p>
              <p className="text-xs text-muted-foreground">
                This organization hasn't hosted any events.
              </p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {displayEvents.slice(0, 6).map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="shrink-0"
                >
                  <EventCard {...event} size="compact" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

