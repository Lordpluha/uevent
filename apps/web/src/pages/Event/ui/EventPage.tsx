import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Bookmark, CalendarDays, ChevronLeft, Clock, Images, MapPin, Share2, Star, Users, Video } from 'lucide-react';
import { EventLightbox } from '@entities/Event';
import { TicketCard } from '@entities/Ticket';
import { Avatar, AvatarFallback, AvatarImage, Badge, Separator } from '@shared/components';
import { useEvent } from '@entities/Event';

export function EventPage() {
  const { id } = useParams();
  const { data: event, isLoading, error } = useEvent(id!);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

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
    return <main className="flex min-h-[60vh] items-center justify-center text-center">Загрузка...</main>;
  }
  if (error || !event) {
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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

      <Link
        to="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All events
      </Link>

      {hasGallery ? (
        <button
          type="button"
          className="relative mb-8 h-64 w-full overflow-hidden rounded-2xl bg-muted sm:h-80 cursor-pointer"
          onClick={() => openGallery(0)}
          aria-label="Open photo gallery"
        >
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover transition-opacity hover:opacity-90"
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
          <div className="absolute bottom-4 right-4">
            <Badge variant="secondary" className="flex items-center gap-1.5 backdrop-blur-sm">
              <Images className="h-3 w-3" />
              {event.gallery!.length} photos
            </Badge>
          </div>
        </button>
      ) : (
        <div className="relative mb-8 h-64 w-full overflow-hidden rounded-2xl bg-muted sm:h-80">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover transition-opacity"
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
                {event.gallery!.length} photos
              </Badge>
            </div>
          )}
        </div>
      )}

          <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">{event.title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Share"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            onClick={() => setIsBookmarked((b) => !b)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent ${
              isBookmarked ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-primary' : ''}`} />
          </button>
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
        <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
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
              key={ticket.ticketType}
              {...ticket}
              eventTitle={event.title}
              eventDate={event.date}
              eventTime={event.time}
              location={event.location ?? 'Online'}
              format={event.format}
              onSelect={() => alert(`Ticket "${ticket.ticketType}" selected!`)}
            />
          ))}
        </div>
      </div>

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
