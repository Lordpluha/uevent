import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Heart,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { organizationsApi, useOrg } from '@entities/Organization';
import { useEvents } from '@entities/Event';
import { EventCard } from '@entities/Event';
import { Separator } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useAuth } from '@shared/lib/auth-context';
import { useMyOrg } from '@entities/Organization';
import { OrgProfileHero } from './OrgProfileHero';

export function OrgProfilePage() {
  const { t } = useAppContext();
  const { isAuthenticated, accountType } = useAuth();
  const queryClient = useQueryClient();
  const { data: myOrg } = useMyOrg();
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading } = useOrg(id ?? '');
  const { data: orgEventsResult } = useEvents(
    org ? { organization_id: org.id } : undefined,
  );
  const orgEvents = orgEventsResult?.data ?? [];
  const isUserViewer = isAuthenticated && accountType === 'user';
  const orgId = org?.id ?? '';

  const { data: followStatus } = useQuery({
    queryKey: ['organization-follow', orgId],
    queryFn: () => organizationsApi.getFollowStatus(orgId),
    enabled: isUserViewer && !!orgId,
  });

  const followMutation = useMutation({
    mutationFn: (nextFollow: boolean) => organizationsApi.setFollow(orgId, nextFollow),
    onSuccess: async (_data, nextFollow) => {
      await queryClient.invalidateQueries({ queryKey: ['organization-follow', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['organizations', orgId] });
      toast.success(nextFollow ? t.organizations.subscribed : t.organizations.unsubscribed);
    },
    onError: () => {
      toast.error(t.organizations.subscribeFailed);
    },
  });

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
        <h1 className="text-xl font-semibold">{t.organizations.notFound}</h1>
        <Link to="/organizations" className="text-sm text-primary hover:underline">
          {t.common.backToOrganizations}
        </Link>
      </main>
    );
  }

  const displayEvents = orgEvents.length > 0 ? orgEvents : [];
  const isOwner = isAuthenticated && accountType === 'organization' && myOrg?.id === org.id;

  return (
    <main className="w-full pb-16">
      <OrgProfileHero
        org={org}
        isOwner={isOwner}
        isUserViewer={isUserViewer}
        followStatus={followStatus}
        isFollowPending={followMutation.isPending}
        onToggleFollow={() => followMutation.mutate(!(followStatus?.followed ?? false))}
      />

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
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-card py-16 text-center">
              <span className="text-4xl">📅</span>
              <p className="text-sm font-medium text-foreground">{t.organizations.noEventsYet}</p>
              <p className="text-xs text-muted-foreground">
                {t.organizations.noEventsDesc}
              </p>
            </div>
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

