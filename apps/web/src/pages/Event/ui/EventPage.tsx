import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Bell, BellOff, CalendarX2, ChevronLeft, UserCheck, UserPlus, Users } from 'lucide-react';
import { EventLightbox, eventsApi, useEvent, useEvents } from '@entities/Event';
import { organizationsApi } from '@entities/Organization';
import { TicketCard } from '@entities/Ticket';
import { Button, Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, EventLocationMap, JsonLd, PromoCodeSection, Separator } from '@shared/components';
import { toast } from 'sonner';
import { useAppContext } from '@shared/lib';
import { SITE_URL } from '@shared/config/app';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { accountType, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const isUser = isAuthenticated && accountType === 'user';
  const orgId = event?.organizerOrgId ?? null;

  const { data: eventSubData } = useQuery({
    queryKey: ['event-subscription', id],
    queryFn: () => eventsApi.getSubscription(id ?? ''),
    enabled: isUser && !!id,
  });
  const { data: orgSubData } = useQuery({
    queryKey: ['org-subscription', orgId],
    queryFn: () => organizationsApi.getFollowStatus(orgId!),
    enabled: isUser && !!orgId,
  });

  const eventSubMutation = useMutation({
    mutationFn: (subscribe: boolean) =>
      subscribe ? eventsApi.subscribe(id ?? '') : eventsApi.unsubscribe(id ?? ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-subscription', id] }),
    onError: () => toast.error(t.errors.somethingWrong),
  });
  const orgFollowMutation = useMutation({
    mutationFn: (follow: boolean) => organizationsApi.setFollow(orgId!, follow),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-subscription', orgId] }),
    onError: () => toast.error(t.errors.somethingWrong),
  });

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

      {/* Subscribe buttons */}
      {isUser && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            variant={eventSubData?.subscribed ? 'default' : 'outline'}
            size="sm"
            onClick={() => eventSubMutation.mutate(!eventSubData?.subscribed)}
            disabled={eventSubMutation.isPending}
            className="gap-1.5"
          >
            {eventSubData?.subscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {eventSubData?.subscribed ? t.events.unsubscribeEvent : t.events.subscribeEvent}
          </Button>
          {orgId && (
            <Button
              variant={orgSubData?.followed ? 'default' : 'outline'}
              size="sm"
              onClick={() => orgFollowMutation.mutate(!orgSubData?.followed)}
              disabled={orgFollowMutation.isPending}
              className="gap-1.5"
            >
              {orgSubData?.followed ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {orgSubData?.followed ? t.events.unfollowOrg : t.events.followOrg}
            </Button>
          )}
        </div>
      )}

      {/* Attendees list */}
      {event.attendeesPublic && event.attendees && event.attendees.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <Users className="h-4 w-4" />
            {t.events.attendees} ({event.attendeeCount})
          </h2>
          <div className="flex flex-wrap gap-2">
            {event.attendees.map((a) => (
              <Link key={a.id} to={`/users/${a.id}`} className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium transition-colors hover:bg-accent">
                {a.avatarUrl && <img src={a.avatarUrl} alt={a.name} className="h-5 w-5 rounded-full object-cover" />}
                {a.name}
              </Link>
            ))}
          </div>
        </section>
      )}

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
