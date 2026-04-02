import { Link } from 'react-router';
import {
  CalendarDays,
  Building2,
  Heart,
  Users,
} from 'lucide-react';

import { EventCard } from '@entities/Event';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, JsonLd, Separator } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { SITE_URL } from '@shared/config/app';
import { OrgProfileHero } from './OrgProfileHero';
import { useOrgProfileData } from './useOrgProfileData';

export function OrgProfilePage({ overrideId }: { overrideId?: string } = {}) {
  const { t } = useAppContext();
  const { org, isLoading, displayEvents, isOwner } = useOrgProfileData(overrideId);

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!org) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <Empty className="max-w-md border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-4" />
            </EmptyMedia>
            <EmptyTitle className="text-base">{t.organizations.notFound}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/organizations" className="text-sm text-primary hover:underline">
              {t.common.backToOrganizations}
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  return (
    <main className="w-full pb-16">
      <JsonLd schema={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: org.title,
        description: org.description,
        url: org.website ?? `${SITE_URL}/organizations/${org.id}`,
        logo: org.avatarUrl,
        image: org.coverUrl ?? org.avatarUrl,
        ...(org.location && { address: { '@type': 'PostalAddress', addressLocality: org.location } }),
        ...(org.email && { email: org.email }),
        ...(org.phone && { telephone: org.phone }),
        numberOfEmployees: { '@type': 'QuantitativeValue', value: org.membersCount },
      }} />
      <OrgProfileHero overrideId={overrideId} />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* ── Stats ────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
          {[
            { label: t.common.members, value: org.membersCount, icon: Users },
            { label: t.common.events, value: org.eventsCount, icon: CalendarDays },
            { label: t.common.followers, value: org.followers, icon: Heart },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card py-4"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-extrabold text-foreground">{value.toLocaleString()}</span>
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* ── Events section ───────────────────────────────────── */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {t.organizations.eventsBy.replace('{{name}}', org.title)}
            </h2>
            {displayEvents.length > 0 && (
              <Link
                to={`/events?organizationId=${org.id}`}
                className="text-xs text-primary hover:underline"
              >
                {t.common.seeAll}
              </Link>
            )}
          </div>

          {displayEvents.length === 0 ? (
            <Empty className="rounded-2xl border border-border/50 bg-card py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarDays className="size-4" />
                </EmptyMedia>
                <EmptyTitle>{t.organizations.noEventsYet}</EmptyTitle>
                <EmptyDescription>{t.organizations.noEventsDesc}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {displayEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="shrink-0">
                  <Link to={`/events/${event.id}`}>
                    <EventCard {...event} size="compact" />
                  </Link>
                  {isOwner && (
                    <div className="mt-2 px-1">
                      <Link to={`/events/${event.id}/tickets/create`} className="text-xs text-primary hover:underline">
                        + {t.events.addTicket}
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

