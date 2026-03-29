import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CalendarDays, CalendarPlus, ChevronLeft, Clock, ExternalLink, Images, MapPin, Star, Users, Video } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EventCard, EventLightbox, useEvent, useEvents } from '@entities/Event';
import { TicketCard } from '@entities/Ticket';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, RichTextEditor, Separator } from '@shared/components';
import { EventLocationMap, PromoCodeSection, ShareButton } from '@shared/components';
import { useAuth } from '@shared/lib/auth-context';
import { authApi } from '@shared/api/auth.api';

export function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading, isError } = useEvent(id ?? '');
  const { data: allEventsResult } = useEvents({ page: 1, limit: 100 });
  const allEvents = allEventsResult?.data ?? [];
  const { isAuthenticated, accountType } = useAuth();
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>();
  const [appliedPromoDiscount, setAppliedPromoDiscount] = useState<number | undefined>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const calendarMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Event id is missing');
      return authApi.addToGoogleCalendar(id);
    },
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

  const hasGallery = Boolean(event?.gallery && event.gallery.length > 0);

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handleLightboxOpenChange = (open: boolean) => {
    setGalleryOpen(open);
    if (!open) setGalleryIndex(null);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!event || isError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">📭</p>
        <h1 className="text-xl font-semibold text-foreground">Event not found</h1>
        <Link to="/events" className="text-sm text-primary hover:underline">
          ← Back to events
        </Link>
      </main>
    );
  }

  const organizerEvents = allEvents
    .filter((item) => item.id !== event.id && item.organizer === event.organizer)
    .slice(0, 4);

  const similarEvents = allEvents
    .filter((item) => {
      if (item.id === event.id) return false;
      const hasSameTag = item.tags.some((tag) => event.tags.includes(tag));
      if (!hasSameTag) return false;
      return !organizerEvents.some((organizerEvent) => organizerEvent.id === item.id);
    })
    .slice(0, 4);

  const description = event.description?.trim() ?? '';

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

      <Link
        to="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All events
      </Link>

      <button
        type="button"
        className={`relative mb-8 h-64 w-full overflow-hidden rounded-2xl bg-muted text-left sm:h-80 ${
          hasGallery ? 'cursor-pointer' : 'cursor-default'
        }`}
        onClick={hasGallery ? () => openGallery(0) : undefined}
        disabled={!hasGallery}
        aria-label={hasGallery ? 'Open photo gallery' : undefined}
      >
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className={`h-full w-full object-cover transition-opacity ${
              hasGallery ? 'hover:opacity-90' : ''
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <Badge variant="secondary" className="flex items-center gap-1.5 backdrop-blur-sm">
            {event.format === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
            {event.format === 'online' ? 'Online' : 'Offline'}
          </Badge>
        </div>
        {hasGallery && (
          <div className="absolute bottom-4 right-4">
            <Badge variant="secondary" className="flex items-center gap-1.5 backdrop-blur-sm">
              <Images className="h-3 w-3" />
              {event.gallery?.length ?? 0} photos
            </Badge>
          </div>
        )}
      </button>

          <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">{event.title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          {isAuthenticated && accountType === 'user' && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              disabled={calendarMutation.isPending || !id}
              onClick={() => calendarMutation.mutate()}
            >
              <CalendarPlus className="h-4 w-4" />
              Google Calendar
            </Button>
          )}
          <ShareButton title={event.title} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: CalendarDays, label: 'Date', value: event.date },
          { icon: Clock, label: 'Time', value: `${event.time} GMT` },
          {
            icon: event.format === 'online' ? Video : MapPin,
            label: event.format === 'online' ? 'Platform' : 'Venue',
            value: event.location ?? 'Online',
          },
          { icon: Users, label: 'Attendees', value: event.attendeeCount.toLocaleString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
            <span className="text-sm font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {event.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
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
          <a
            href={event.onlineUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Join meeting
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {event.format === 'offline' && event.googleMapsUrl && (
          <a
            href={event.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Open in Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
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
                <Avatar
                  key={a.id}
                  className="h-8 w-8 border-2 border-background"
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                >
                  <AvatarImage src={a.avatarUrl} alt={a.name} />
                  <AvatarFallback className="text-[11px]">{a.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{event.attendeeCount.toLocaleString()}</span> people
              attending
            </span>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">Tickets</h2>
        <div className="flex flex-col gap-3">
          {event.tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              {...ticket}
              eventTitle={event.title}
              eventDate={event.date}
              eventTime={event.time}
              location={event.location ?? 'Online'}
              format={event.format}
              onSelect={() => {
                const params = new URLSearchParams({ ticketType: ticket.ticketType });
                if (appliedPromoCode) params.set('promo', appliedPromoCode);
                navigate(`/checkout/${event.id}/review?${params.toString()}`);
              }}
            />
          ))}
        </div>
      </div>

      <Separator className="my-8" />

      {event.location && event.location !== 'Online' && (
        <section className="mb-8">
          <EventLocationMap location={event.location} eventTitle={event.title} />
        </section>
      )}

      <section className="mb-8">
        <PromoCodeSection
          onApplyPromo={(code, discount) => {
            setAppliedPromoCode(code);
            setAppliedPromoDiscount(discount);
            toast.success(`Promo code ${code} applied! ${discount}% discount.`);
          }}
          onRemovePromo={() => {
            setAppliedPromoCode(undefined);
            setAppliedPromoDiscount(undefined);
            toast.info('Promo code removed');
          }}
          appliedCode={appliedPromoCode}
          appliedDiscount={appliedPromoDiscount}
        />
      </section>

      <Separator className="my-8" />

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Other events by organizer</h2>
          {organizerEvents.length > 0 && (
            <Link to="/events" className="text-xs text-primary hover:underline">
              See all
            </Link>
          )}
        </div>
        {organizerEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other events from this organizer yet.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {organizerEvents.map((item) => (
              <Link key={item.id} to={`/events/${item.id}`} className="shrink-0">
                <EventCard {...item} size="compact" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Similar events</h2>
          {similarEvents.length > 0 && (
            <Link to="/events" className="text-xs text-primary hover:underline">
              Discover more
            </Link>
          )}
        </div>
        {similarEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No similar events found right now.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {similarEvents.map((item) => (
              <Link key={item.id} to={`/events/${item.id}`} className="shrink-0">
                <EventCard {...item} size="compact" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {event.gallery && event.gallery.length > 0 && (
        <EventLightbox
          images={event.gallery}
          index={galleryIndex}
          open={galleryOpen}
          onIndexChange={setGalleryIndex}
          onOpenChange={handleLightboxOpenChange}
        />
      )}
    </main>
  );
}
