import { CalendarDays, CalendarPlus, Clock, ExternalLink, MapPin, Star, Users, Video } from 'lucide-react';
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
import { useAuth } from '@shared/lib/auth-context';
import { authApi } from '@shared/api/auth.api';
import type { EventModel } from '@entities/Event';

interface Props {
  event: EventModel;
  eventId: string;
}

export function EventDetails({ event, eventId }: Props) {
  const { isAuthenticated, accountType } = useAuth();
  const description = event.description?.trim() ?? '';

  const calendarMutation = useMutation({
    mutationFn: () => authApi.addToGoogleCalendar(eventId),
    onSuccess: (data) => {
      toast.success('Added to Google Calendar!');
      if (data.htmlLink) window.open(data.htmlLink, '_blank');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      const lower = msg.toLowerCase();
      if (lower.includes('google calendar api is disabled')) {
        toast.error('Google Calendar API is disabled in Google Cloud. Enable calendar-json.googleapis.com and try again.');
        return;
      }
      if (lower.includes('google calendar access denied') || lower.includes('google account not linked')) {
        toast.error('Google Calendar access denied. Re-link your Google account.', {
          action: { label: 'Link Google', onClick: () => window.location.assign('/api/auth/google') },
        });
        return;
      }
      toast.error('Failed to add to Google Calendar. Make sure your Google account is linked.');
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
              <CalendarPlus className="h-4 w-4" /> Google Calendar
            </Button>
          )}
          <ShareButton title={event.title} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: CalendarDays, label: 'Date', value: event.date },
          { icon: Clock, label: 'Time', value: `${event.time} GMT` },
          { icon: event.format === 'online' ? Video : MapPin, label: event.format === 'online' ? 'Platform' : 'Venue', value: event.location ?? 'Online' },
          { icon: Users, label: 'Attendees', value: event.attendeeCount.toLocaleString() },
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
            <p className="text-xs text-muted-foreground">Organized by</p>
            <p className="text-sm font-semibold text-foreground">{event.organizer}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-rose-500 text-rose-500" />
          <span className="text-sm font-bold text-foreground">{event.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">rating</span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-foreground">About this event</h2>
        <RichTextEditor
          defaultValue={description}
          readOnly
          showToolbar={false}
          placeholder=""
          className="border-0 bg-transparent p-0 shadow-none focus-within:border-0 focus-within:ring-0"
        />

        {event.format === 'online' && event.onlineUrl && (
          <a href={event.onlineUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            Join meeting <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {event.format === 'offline' && event.googleMapsUrl && (
          <a href={event.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <Separator className="mb-8" />

      {event.attendees && event.attendees.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-foreground">Who's going</h2>
          <div className="flex items-center gap-3">
            <div className="flex">
              {event.attendees.map((a, i) => (
                <Avatar key={a.id} className="h-8 w-8 border-2 border-background" style={{ marginLeft: i === 0 ? 0 : -8 }}>
                  <AvatarImage src={a.avatarUrl} alt={a.name} />
                  <AvatarFallback className="text-[11px]">{a.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{event.attendeeCount.toLocaleString()}</span> people attending
            </span>
          </div>
        </div>
      )}
    </>
  );
}
