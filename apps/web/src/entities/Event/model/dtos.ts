import { z } from 'zod';
import { eventFormatSchema } from './eventEntity';

const optionalUrlField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.string().url().optional());

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  format: eventFormatSchema,
  location: z.string().optional(),
  googleMapsUrl: optionalUrlField,
  onlineUrl: optionalUrlField,
  organizationId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  imageUrl: optionalUrlField,
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  format: eventFormatSchema.optional(),
  location: z.string().optional(),
  googleMapsUrl: optionalUrlField,
  onlineUrl: optionalUrlField,
  tags: z.array(z.string()).optional(),
  imageUrl: optionalUrlField,
});

export const eventListParamsSchema = z.object({
  search: z.string().optional(),
  format: eventFormatSchema.optional(),
  organization_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  location: z.string().optional(),
  location_from: z.string().optional(),
  location_to: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  user_id: z.string().uuid().optional(),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
export type EventListParams = z.infer<typeof eventListParamsSchema>;
