import { Link, Navigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Edit,
  Globe,
  MapPin,
  Settings,
  Star,
  Ticket,
  Users,
  Clock,
} from 'lucide-react';
import { EventCard, useEvents } from '@entities/Event';
import { useMe } from '@entities/User';
import { api } from '@shared/api';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Separator,
  ShareButton,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/components';
import { cn } from '@shared/lib/utils';
import { useAuth } from '@shared/lib/auth-context';

const STAT_ITEMS = [
  { key: 'eventsAttended', label: 'Events attended', icon: CalendarDays },
  { key: 'ticketsCount', label: 'Tickets', icon: Ticket },
  { key: 'followers', label: 'Followers', icon: Users },
  { key: 'following', label: 'Following', icon: Users },
] as const;

type ProfileTicket = {
  id: string;
  name: string;
  price: number | string;
  status: 'DRAFT' | 'READY' | 'RESERVED' | 'PAID';
  datetime_start?: string;
  event?: {
    id?: string;
    name?: string;
  };
};

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
  const { isAuthenticated, isReady } = useAuth();
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

  if (isLoading) return <ProfileSkeleton />;

  if (!user || isError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">👤</p>
        <h1 className="text-xl font-semibold">Profile unavailable</h1>
        <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
      </main>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">

      {/* ── Hero card ─────────────────────────────────────────── */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div
          className="h-28 w-full bg-linear-to-br from-primary/30 via-primary/10 to-transparent"
          aria-hidden
        />
        <div className="px-6 pb-6">
          <div className="-mt-14 mb-4 flex items-end justify-between">
            <Avatar className="h-24 w-24 shrink-0 border-4 border-card ring-2 ring-primary/20 shadow-md">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 pb-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link to="/profile/settings">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Edit className="h-3.5 w-3.5" />
                        Edit profile
                      </Button>
                    </Link>
                  }
                />
                <TooltipContent>Go to settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link to="/profile/settings">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Settings">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  }
                />
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
              <ShareButton title={`${user.name} on UEVENT`} />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight">{user.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="mt-2 max-w-lg text-sm text-foreground/80">{user.bio}</p>}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {user.timezone && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {user.timezone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              Joined {user.joinedAt}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card py-5 transition-colors hover:border-primary/40"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-extrabold text-primary tabular-nums">
              {user[key].toLocaleString()}
            </span>
            <span className="text-center text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Interests ──────────────────────────────────────────── */}
      {user.interests.length > 0 && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold">Interests</h2>
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
          <h2 className="text-base font-semibold">My events</h2>
          <Link to="/events" className="flex items-center gap-1 text-xs text-primary hover:underline">
            See all <Star className="h-3 w-3" />
          </Link>
        </div>
        {myEvents.length === 0 ? (
          <div className={cn(
            'flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 py-10 text-center'
          )}>
            <p className="text-3xl">🗓️</p>
            <p className="text-sm text-muted-foreground">No events yet</p>
            <Link to="/events">
              <Button variant="outline" size="sm">Browse events</Button>
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
          <h2 className="text-base font-semibold">My purchased tickets</h2>
        </div>

        {ticketsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : myTickets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 py-10 text-center">
            <p className="text-3xl">🎟️</p>
            <p className="text-sm text-muted-foreground">You have no purchased tickets yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <ul className="divide-y divide-border/60">
              {myTickets.map((ticket) => {
                const eventName = ticket.event?.name ?? 'Event';
                const eventId = ticket.event?.id;
                const price = Number(ticket.price ?? 0);
                const date = ticket.datetime_start ? new Date(ticket.datetime_start) : null;

                return (
                  <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{ticket.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {eventId ? (
                          <Link to={`/events/${eventId}`} className="text-primary hover:underline">
                            {eventName}
                          </Link>
                        ) : (
                          eventName
                        )}
                        {date ? ` • ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-foreground">{price > 0 ? `$${price.toFixed(2)}` : 'Free'}</p>
                      <p className="text-xs text-muted-foreground">{ticket.status}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
