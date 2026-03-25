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
  id: z.number(),
  ticketType: ticketTypeSchema,
  price: z.number(),
  currency: z.string().optional(),
  seat: z.string().optional(),
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
