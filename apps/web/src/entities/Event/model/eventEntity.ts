import { z } from 'zod';
import { ticketStatusSchema, ticketTypeSchema } from '@entities/Ticket/model/ticketEntity';

export const eventFormatSchema = z.enum(['online', 'offline']);

export const galleryImageSchema = z.object({
  src: z.string().url(),
  msrc: z.string().url().optional(),
  w: z.number(),
  h: z.number(),
  title: z.string().optional(),
});
export type EventFormat = z.infer<typeof eventFormatSchema>;

export const eventAttendeeSchema = z.object({
  id: z.string(),
  avatarUrl: z.string().url().optional(),
  name: z.string(),
});

export const eventTicketOptionSchema = z.object({
  id: z.string(),
  ticketType: ticketTypeSchema,
  price: z.number(),
  datetimeStart: z.string().optional(),
  datetimeEnd: z.string().optional(),
  currency: z.string().optional(),
  seat: z.string().optional(),
  quantityLimited: z.boolean().optional(),
  quantityTotal: z.number().optional(),
  quantitySold: z.number().optional(),
  status: ticketStatusSchema,
});

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string().url().optional(),
  date: z.string(),
  time: z.string(),
  format: eventFormatSchema,
  location: z.string().optional(),
  googleMapsUrl: z.string().url().optional(),
  onlineUrl: z.string().url().optional(),
  locationFrom: z.string().optional(),
  locationTo: z.string().optional(),
  organizer: z.string(),
  rating: z.number(),
  attendeeCount: z.number(),
  attendees: z.array(eventAttendeeSchema).optional(),
  isBookmarked: z.boolean().optional(),
  description: z.string(),
  tags: z.array(z.string()),
  tickets: z.array(eventTicketOptionSchema),
  gallery: z.array(galleryImageSchema).optional(),
});

export const eventListSchema = z.array(eventSchema);

export type EventAttendee = z.infer<typeof eventAttendeeSchema>;
export type EventTicketOption = z.infer<typeof eventTicketOptionSchema>;
export type GalleryImage = z.infer<typeof galleryImageSchema>;
export type EventModel = z.infer<typeof eventSchema>;
export type EventList = z.infer<typeof eventListSchema>;

// ── Raw backend shapes ─────────────────────────────────────

export type ApiEventTicket = {
  id: string;
  name?: string | null;
  price?: number | string | null;
  datetime_start?: string | Date | null;
  datetime_end?: string | Date | null;
  status?: string | null;
  user_id?: string | null;
  ticketType?: string | null;
  currency?: string | null;
  seat?: string | null;
  quantity_limited?: boolean | null;
  quantity_total?: number | null;
  quantity_sold?: number | null;
};

export type ApiEvent = {
  id: string;
  name: string;
  description?: string | null;
  gallery?: string[] | null;
  datetime_start?: string | Date;
  datetime_end?: string | Date;
  format?: string | null;
  location?: string | null;
  location_map_url?: string | null;
  online_link?: string | null;
  organizer?: string | null;
  attendeeCount?: number | null;
  attendees?: Array<{ id: string; avatarUrl?: string; name: string }>;
  isBookmarked?: boolean;
  organization_id?: string | null;
  tags?: Array<{ id: string; name: string }>;
  tickets?: ApiEventTicket[];
};

export type ApiEventListResponse = {
  data: ApiEvent[];
  meta: { total: number; page: number; limit: number; total_pages: number };
};

// ── Mapper helpers ─────────────────────────────────────────

export const mapTicketStatus = (status?: string | null): 'available' | 'limited' | 'sold-out' => {
  switch (status) {
    case 'READY':
    case 'DRAFT':
      return 'available';
    case 'RESERVED':
      return 'limited';
    case 'PAID':
      return 'sold-out';
    default:
      return 'available';
  }
};

export const toDisplayDate = (value?: string | Date): string => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const toDisplayTime = (value?: string | Date): string => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const mapApiEvent = (event: ApiEvent): EventModel => {
  const firstGalleryImage = event.gallery?.[0];
  const parsedFormat = event.format === 'online' || event.format === 'offline'
    ? event.format
    : undefined;
  const nowTs = Date.now();
  const ticketSource = (event.tickets ?? []).filter((ticket) => {
    if (!ticket.datetime_end) return true;
    const endTs = new Date(ticket.datetime_end).getTime();
    return Number.isNaN(endTs) || endTs >= nowTs;
  });

  const toIsoOrUndefined = (value?: string | Date | null) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  };

  const soldFromQuantities = (event.tickets ?? []).reduce((sum, ticket) => {
    const sold = Number(ticket.quantity_sold ?? 0);
    return Number.isFinite(sold) ? sum + Math.max(0, sold) : sum;
  }, 0);

  const attendeeCountFromTickets = soldFromQuantities > 0
    ? soldFromQuantities
    : (event.tickets ?? []).filter((ticket) => ticket.status === 'PAID' || ticket.user_id).length;

  return {
    id: event.id,
    title: event.name,
    imageUrl: firstGalleryImage,
    date: toDisplayDate(event.datetime_start),
    time: toDisplayTime(event.datetime_start),
    format: (parsedFormat ?? (event.location ? 'offline' : 'online')) as EventFormat,
    location: event.location ?? undefined,
    googleMapsUrl: event.location_map_url ?? undefined,
    onlineUrl: event.online_link ?? undefined,
    organizer: event.organizer ?? (event.organization_id ? String(event.organization_id) : 'Organizer'),
    rating: 0,
    attendeeCount: event.attendeeCount ?? attendeeCountFromTickets ?? event.attendees?.length ?? 0,
    attendees: event.attendees ?? [],
    isBookmarked: event.isBookmarked ?? false,
    description: event.description ?? '',
    tags: event.tags?.map((tag) => tag.name) ?? [],
    tickets: ticketSource.map((ticket) => ({
      id: String(ticket.id),
      ticketType:
        ticket.ticketType === 'free' || ticket.ticketType === 'standard' || ticket.ticketType === 'vip'
          ? ticket.ticketType
          : Number(ticket.price ?? 0) === 0
            ? 'free'
            : 'standard',
      price: Number(ticket.price ?? 0),
      datetimeStart: toIsoOrUndefined(ticket.datetime_start),
      datetimeEnd: toIsoOrUndefined(ticket.datetime_end),
      currency: ticket.currency ?? '$',
      seat: ticket.seat ?? undefined,
      quantityLimited: ticket.quantity_limited ?? undefined,
      quantityTotal: ticket.quantity_total ?? undefined,
      quantitySold: ticket.quantity_sold ?? undefined,
      status:
        ticket.quantity_limited && ticket.quantity_total !== null && ticket.quantity_total !== undefined
          ? (ticket.quantity_sold ?? 0) >= ticket.quantity_total
            ? 'sold-out'
            : mapTicketStatus(ticket.status)
          : mapTicketStatus(ticket.status),
    })),
    gallery:
      event.gallery?.map((src) => ({
        src,
        msrc: src,
        w: 1200,
        h: 800,
      })) ?? [],
  };
};

