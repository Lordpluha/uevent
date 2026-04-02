import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CalendarX2, ChevronLeft } from 'lucide-react';
import { EventLightbox, useEvent, useEvents } from '@entities/Event';
import { TicketCard } from '@entities/Ticket';
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, EventLocationMap, JsonLd, PromoCodeSection, Separator } from '@shared/components';
import { toast } from 'sonner';
import { useAppContext } from '@shared/lib';
import { SITE_URL } from '@shared/config/app';
import { EventHero } from './EventHero';
import { EventDetails } from './EventDetails';
import { EventRelatedSection } from './EventRelatedSection';
import { useAuth } from '@shared/lib/auth-context';

export function EventPage() {
  const { t } = useAppContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading, isError } = useEvent(id ?? '');
  const { data: allEventsResult } = useEvents({ page: 1, limit: 100 });
  const allEvents = allEventsResult?.data ?? [];
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>();
  const [appliedPromoDiscount, setAppliedPromoDiscount] = useState<number | undefined>();
  const { accountType } = useAuth();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const hasGallery = Boolean(event?.gallery && event.gallery.length > 0);

  const openGallery = (index: number) => { setGalleryIndex(index); setGalleryOpen(true); };

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
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <Empty className="max-w-md border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarX2 className="size-4" />
            </EmptyMedia>
            <EmptyTitle className="text-base">{t.events.notFound}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/events" className="text-sm text-primary hover:underline">{t.common.backToEvents}</Link>
          </EmptyContent>
        </Empty>
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
      return !organizerEvents.some((oe) => oe.id === item.id);
    })
    .slice(0, 4);

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description?.replace(/<[^>]+>/g, '').slice(0, 500) || undefined,
    startDate: event.date,
    url: `${SITE_URL}/events/${event.id}`,
    image: event.imageUrl,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      event.format === 'online'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    location:
      event.format === 'online'
        ? { '@type': 'VirtualLocation', url: event.onlineUrl ?? `${SITE_URL}/events/${event.id}` }
        : { '@type': 'Place', name: event.location },
    organizer: { '@type': 'Organization', name: event.organizer },
    ...(event.tickets.length > 0 && {
      offers: event.tickets.map((t) => ({
        '@type': 'Offer',
        name: t.ticketType,
        price: t.price,
        priceCurrency: (t.currency ?? 'USD').toUpperCase(),
        availability:
          t.status === 'sold-out'
            ? 'https://schema.org/SoldOut'
            : t.status === 'limited'
              ? 'https://schema.org/LimitedAvailability'
              : 'https://schema.org/InStock',
        url: `${SITE_URL}/events/${event.id}`,
      })),
    }),
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd schema={eventJsonLd} />
      <Link to="/events" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> {t.events.allEvents}
      </Link>

      <EventHero event={event} hasGallery={hasGallery} onOpenGallery={openGallery} />
      <EventDetails event={event} eventId={id ?? ''} />

      {/* Tickets */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">{t.events.tickets}</h2>
        <div className="flex flex-col gap-3">
          {event.tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              {...ticket}
              eventTitle={event.title}
              eventDate={event.date}
              eventTime={event.time}
              location={event.location ?? t.common.online}
              format={event.format}
              onSelect={() => {
                if (accountType === 'organization') {
                  toast.error('Organization accounts cannot purchase tickets');
                  return;
                }
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
          eventId={event.id}
          onApplyPromo={(promo) => {
            setAppliedPromoCode(promo.code);
            setAppliedPromoDiscount(promo.discountPercent);
            toast.success(t.events.promoApplied.replace('{{code}}', promo.code).replace('{{discount}}', String(promo.discountPercent)));
          }}
          onRemovePromo={() => {
            setAppliedPromoCode(undefined);
            setAppliedPromoDiscount(undefined);
            toast.info(t.events.promoRemoved);
          }}
          appliedCode={appliedPromoCode}
          appliedDiscount={appliedPromoDiscount}
        />
      </section>

      <Separator className="my-8" />

      <EventRelatedSection organizerEvents={organizerEvents} similarEvents={similarEvents} />

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
