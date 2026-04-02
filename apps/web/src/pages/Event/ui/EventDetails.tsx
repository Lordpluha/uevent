import { useState } from 'react';
import { Link } from 'react-router';
import { CalendarDays, CalendarPlus, ChevronDown, ChevronUp, Clock, ExternalLink, Lock, MapPin, Star, Users, Video } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  RichTextEditor,
  Separator,
} from '@shared/components';
import { ShareButton } from '@shared/components/ShareButton/ShareButton';
import { useAppContext } from '@shared/lib';
import { useAuth } from '@shared/lib/auth-context';
import { authApi } from '@shared/api/auth.api';
import type { EventModel } from '@entities/Event';

interface Props {
  event: EventModel;
  eventId: string;
}

export function EventDetails({ event, eventId }: Props) {
  const { t } = useAppContext();
  const { isAuthenticated, accountType } = useAuth();
  const [attendeesExpanded, setAttendeesExpanded] = useState(false);
  const description = event.description?.trim() ?? '';

  const calendarMutation = useMutation({
    mutationFn: () => authApi.addToGoogleCalendar(eventId),
    onSuccess: (data) => {
      toast.success(t.events.details.calendarAdded);
      if (data.htmlLink) window.open(data.htmlLink, '_blank');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      const lower = msg.toLowerCase();
      if (lower.includes('google calendar api is disabled')) {
        toast.error(t.events.details.calendarApiDisabled);
        return;
      }
      if (lower.includes('google calendar access denied') || lower.includes('google account not linked')) {
        toast.error(t.events.details.calendarAccessDenied, {
          action: { label: t.events.details.calendarLinkGoogle, onClick: () => window.location.assign('/api/auth/google') },
        });
        return;
      }
      toast.error(t.events.details.calendarFailed);
    },
  });

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">{event.title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          {isAuthenticated && accountType === 'user' && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              disabled={calendarMutation.isPending || !eventId}
              onClick={() => calendarMutation.mutate()}
            >
              <CalendarPlus className="h-4 w-4" /> {t.events.details.googleCalendar}
            </Button>
          )}
          <ShareButton title={event.title} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: CalendarDays, label: t.common.date, value: event.date },
          { icon: Clock, label: t.common.time, value: `${event.time} ${t.common.gmt}` },
          { icon: event.format === 'online' ? Video : MapPin, label: event.format === 'online' ? t.events.details.platform : t.events.details.venue, value: event.location ?? t.common.online },
          { icon: Users, label: t.common.attendees, value: event.attendeeCount.toLocaleString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span>
            <span className="text-sm font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {event.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
      </div>

      <Separator className="mb-6" />

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
            {event.organizer[0]}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.events.details.organizedBy}</p>
            <p className="text-sm font-semibold text-foreground">{event.organizer}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-rose-500 text-rose-500" />
          <span className="text-sm font-bold text-foreground">{event.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">{t.events.details.rating}</span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-foreground">{t.events.details.aboutEvent}</h2>
        <RichTextEditor
          defaultValue={description}
          readOnly
          showToolbar={false}
          placeholder=""
          className="border-0 bg-transparent p-0 shadow-none focus-within:border-0 focus-within:ring-0"
        />

        {event.format === 'online' && event.onlineUrl && (
          <a href={event.onlineUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            {t.events.details.joinMeeting} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {event.format === 'offline' && event.googleMapsUrl && (
          <a href={event.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            {t.events.details.openGoogleMaps} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <Separator className="mb-8" />

      {/* ── Attendees ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">{t.events.details.whosGoing}</h2>
          {event.attendeesPublic ? (
            <button
              type="button"
              onClick={() => setAttendeesExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {attendeesExpanded ? t.events.details.attendeesHide : t.events.details.attendeesSeeAll}
              {attendeesExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              {t.events.details.attendeesPrivate}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          {event.attendees && event.attendees.length > 0 ? (
            <div className="flex">
              {event.attendees.slice(0, 6).map((a, i) => (
                <Avatar key={a.id} className="h-8 w-8 border-2 border-background" style={{ marginLeft: i === 0 ? 0 : -8 }}>
                  <AvatarImage src={a.avatarUrl} alt={a.name} />
                  <AvatarFallback className="text-[11px]">{a.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          ) : null}
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{event.attendeeCount.toLocaleString()}</span>{' '}
            {t.events.details.peopleAttending}
          </span>
        </div>

        {event.attendeesPublic && attendeesExpanded && event.attendees && event.attendees.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {event.attendees.map((a) =>
              a.username ? (
                <Link
                  key={a.id}
                  to={`/users/${a.username}`}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={a.avatarUrl} alt={a.name} />
                    <AvatarFallback className="text-[10px]">{a.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs font-medium text-foreground">{a.name}</span>
                </Link>
              ) : (
                <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={a.avatarUrl} alt={a.name} />
                    <AvatarFallback className="text-[10px]">{a.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs font-medium text-foreground">{a.name}</span>
                </div>
              )
            )}
          </div>
        )}

        {event.attendeesPublic && attendeesExpanded && (!event.attendees || event.attendees.length === 0) && (
          <p className="mt-4 text-sm text-muted-foreground">{t.events.details.attendeesNone}</p>
        )}
      </div>
    </>
  );
}
