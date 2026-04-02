import { z } from 'zod';
import { ticketStatusSchema, ticketTypeSchema } from '@shared/lib/ticket-schemas';

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
  username: z.string().nullable().optional(),
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
  attendeesPublic: z.boolean().optional(),
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
  attendeesPublic?: boolean | null;
  attendees_public?: boolean | null;
  attendees?: Array<{ id: string; avatarUrl?: string; name: string; username?: string | null }>;
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

export { mapTicketStatus, toDisplayDate, toDisplayTime, mapApiEvent } from './eventMappers';

