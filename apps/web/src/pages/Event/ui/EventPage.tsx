import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { EventLightbox, useEvent, useEvents } from '@entities/Event';
import { TicketCard } from '@entities/Ticket';
import { EventLocationMap, PromoCodeSection, Separator } from '@shared/components';
import { toast } from 'sonner';
import { useAppContext } from '@shared/lib';
import { EventHero } from './EventHero';
import { EventDetails } from './EventDetails';
import { EventRelatedSection } from './EventRelatedSection';

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

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

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
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">📭</p>
        <h1 className="text-xl font-semibold text-foreground">{t.events.notFound}</h1>
        <Link to="/events" className="text-sm text-primary hover:underline">{t.common.backToEvents}</Link>
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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
            toast.success(t.events.promoApplied.replace('{{code}}', code).replace('{{discount}}', String(discount)));
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
