import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Settings,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import { OrgProfilePage } from '@pages/OrgProfile';
import { EventCard } from '@entities/Event';
import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@shared/components';
import { cn } from '@shared/lib/utils';
import { useAppContext } from '@shared/lib';
import { ProfileHeroCard } from './ProfileHeroCard';
import { ProfileTicketsList } from './ProfileTicketsList';
import { useProfileViewData } from './useProfileViewData';

const STAT_ITEMS = [
  { key: 'eventsAttended', icon: CalendarDays, color: 'text-blue-500' },
  { key: 'ticketsCount', icon: Ticket, color: 'text-violet-500' },
  { key: 'followers', icon: Users, color: 'text-pink-500' },
  { key: 'following', icon: Users, color: 'text-emerald-500' },
] as const;

function ProfileSkeleton() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card">
        <Skeleton className="h-28 w-full" />
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </main>
  );
}

export function ProfileViewPage() {
  const { t } = useAppContext();
  const { isAuthenticated, accountType, isReady, myOrg, myOrgLoading, user, isLoading, isError, myEvents } = useProfileViewData();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'tickets'>('overview');

  if (!isReady) return <ProfileSkeleton />;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (isAuthenticated && accountType === 'organization') {
    if (myOrgLoading) return <ProfileSkeleton />;
    return (
      <>
        <OrgProfilePage overrideId={myOrg?.id} />
        {/* Owner action toolbar — fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-sm shadow-lg">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.profile.orgProfileBanner}</p>
              <p className="text-xs text-muted-foreground">{t.profile.orgProfileDesc}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link to={`/organizations/${myOrg?.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t.profile.previewProfile}
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Settings className="h-3.5 w-3.5" />
                  {t.profile.settings}
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {t.orgAccount.title}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Spacer so page content clears the fixed bar */}
        <div className="h-16" />
      </>
    );
  }

  if (isLoading) return <ProfileSkeleton />;

  if (!user || isError) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <Empty className="max-w-md border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="size-4" />
            </EmptyMedia>
            <EmptyTitle className="text-base">{t.profile.unavailable}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/" className="text-sm text-primary hover:underline">{t.common.backToHome}</Link>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  const STAT_LABELS: Record<string, string> = {
    eventsAttended: t.profile.eventsAttended,
    ticketsCount: t.profile.tickets,
    followers: t.common.followers,
    following: t.common.following,
  };

  const tabs = [
    { id: 'overview' as const, label: t.profile.overview, icon: Users },
    { id: 'events' as const, label: t.profile.myEvents, icon: CalendarDays },
    { id: 'tickets' as const, label: t.profile.tickets, icon: Ticket },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">

      <ProfileHeroCard />

      {/* ── Tab bar ───────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STAT_ITEMS.map(({ key, icon: Icon, color }) => (
              <div
                key={key}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card py-5 transition-colors hover:border-primary/40 hover:shadow-sm"
              >
                <Icon className={cn('h-4 w-4', color)} />
                <span className="text-2xl font-extrabold tabular-nums text-foreground">
                  {user[key].toLocaleString()}
                </span>
                <span className="text-center text-xs text-muted-foreground">{STAT_LABELS[key]}</span>
              </div>
            ))}
          </div>

          {/* Interests */}
          {user.interests.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold">{t.profile.interests}</h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-default select-none">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Events tab ───────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">{t.profile.myEvents}</h2>
            <Link to="/events" className="flex items-center gap-1 text-xs text-primary hover:underline">
              {t.common.seeAll} <Star className="h-3 w-3" />
            </Link>
          </div>
          {myEvents.length === 0 ? (
            <Empty className={cn('rounded-xl border border-border/60 py-10')}>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarDays className="size-4" />
                </EmptyMedia>
                <EmptyDescription className="text-sm">{t.profile.noEventsYet}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link to="/events">
                  <Button variant="outline" size="sm">{t.profile.browseEvents}</Button>
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-wrap gap-4">
              {myEvents.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="shrink-0">
                  <EventCard {...event} size="compact" />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Tickets tab ──────────────────────────────────────────── */}
      {activeTab === 'tickets' && (
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold">{t.profile.myTickets}</h2>
          </div>
          <ProfileTicketsList />
        </section>
      )}
    </main>
  );
}
