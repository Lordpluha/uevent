import { z } from 'zod';
import { eventFormatSchema } from './eventEntity';

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  format: eventFormatSchema,
  location: z.string().optional(),
  organizationId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  format: eventFormatSchema.optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

export const eventListParamsSchema = z.object({
  search: z.string().optional(),
  format: eventFormatSchema.optional(),
  organization_id: z.number().optional(),
  tags: z.array(z.string()).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  location: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
export type EventListParams = z.infer<typeof eventListParamsSchema>;
