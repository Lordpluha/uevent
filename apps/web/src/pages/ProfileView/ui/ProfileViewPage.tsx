import { Link, Navigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import { EventCard, useEvents } from '@entities/Event';
import { useMe } from '@entities/User';
import { useMyOrg } from '@entities/Organization';
import { api } from '@shared/api';
import {
  Badge,
  Button,
  Separator,
  Skeleton,
} from '@shared/components';
import { cn } from '@shared/lib/utils';
import { useAppContext } from '@shared/lib';
import { useAuth } from '@shared/lib/auth-context';
import { ProfileHeroCard } from './ProfileHeroCard';
import { ProfileTicketsList, type ProfileTicket } from './ProfileTicketsList';

const STAT_ITEMS = [
  { key: 'eventsAttended', icon: CalendarDays },
  { key: 'ticketsCount', icon: Ticket },
  { key: 'followers', icon: Users },
  { key: 'following', icon: Users },
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
  const { isAuthenticated, accountType, isReady } = useAuth();
  const { data: myOrg, isLoading: myOrgLoading } = useMyOrg();
  const { data: user, isLoading, isError } = useMe();
  const { data: eventsResult } = useEvents({ page: 1, limit: 4, user_id: user?.id }, !!user?.id);
  const myEvents = eventsResult?.data ?? [];
  const { data: ticketsResult, isLoading: ticketsLoading } = useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: async () =>
      (await api.get<{ data: ProfileTicket[] }>('/tickets', {
        params: { user_id: user?.id, page: 1, limit: 20 },
      })).data,
    enabled: !!user?.id,
  });
  const myTickets = ticketsResult?.data ?? [];

  if (!isReady) return <ProfileSkeleton />;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (isAuthenticated && accountType === 'organization') {
    if (myOrgLoading) return <ProfileSkeleton />;
    if (myOrg?.id) return <Navigate to={`/profile/organization/${myOrg.id}`} replace />;
  }

  if (isLoading) return <ProfileSkeleton />;

  if (!user || isError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">👤</p>
        <h1 className="text-xl font-semibold">{t.profile.unavailable}</h1>
        <Link to="/" className="text-sm text-primary hover:underline">{t.common.backToHome}</Link>
      </main>
    );
  }

  const STAT_LABELS: Record<string, string> = {
    eventsAttended: t.profile.eventsAttended,
    ticketsCount: t.profile.tickets,
    followers: t.common.followers,
    following: t.common.following,
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">

      <ProfileHeroCard user={user} />

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_ITEMS.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card py-5 transition-colors hover:border-primary/40"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-extrabold text-primary tabular-nums">
              {user[key].toLocaleString()}
            </span>
            <span className="text-center text-xs text-muted-foreground">{STAT_LABELS[key]}</span>
          </div>
        ))}
      </div>

      {/* ── Interests ──────────────────────────────────────────── */}
      {user.interests.length > 0 && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold">{t.profile.interests}</h2>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-default select-none">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
          <Separator className="mb-8" />
        </>
      )}

      {/* ── My events ──────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.profile.myEvents}</h2>
          <Link to="/events" className="flex items-center gap-1 text-xs text-primary hover:underline">
            {t.common.seeAll} <Star className="h-3 w-3" />
          </Link>
        </div>
        {myEvents.length === 0 ? (
          <div className={cn(
            'flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 py-10 text-center'
          )}>
            <p className="text-3xl">🗓️</p>
            <p className="text-sm text-muted-foreground">{t.profile.noEventsYet}</p>
            <Link to="/events">
              <Button variant="outline" size="sm">{t.profile.browseEvents}</Button>
            </Link>
          </div>
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

      <Separator className="my-8" />

      {/* ── Purchased tickets ─────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.profile.myTickets}</h2>
        </div>
        <ProfileTicketsList tickets={myTickets} isLoading={ticketsLoading} />
      </section>
    </main>
  );
}
