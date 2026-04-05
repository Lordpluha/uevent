import { z } from 'zod'

/* ── Raw backend shapes (as returned by the API) ─────────── */

export const backendTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
})

export const backendTicketSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string(),
  description: z.string().nullable().optional(),
  datetime_start: z.string(),
  datetime_end: z.string(),
  price: z.union([z.number(), z.string()]),
  private_info: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  seat: z.string().nullable().optional(),
  ticketType: z.string().optional(),
  currency: z.string().optional(),
})

export const backendEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  gallery: z.array(z.string()).nullable().optional(),
  time_zone: z.string().optional(),
  datetime_start: z.string(),
  datetime_end: z.string(),
  seats: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  organization_id: z.string().uuid().nullable().optional(),
  tags: z.array(backendTagSchema).optional(),
  tickets: z.array(backendTicketSchema).optional(),
  format: z.string().optional(),
  organizer: z.string().optional(),
  rating: z.number().optional(),
  attendeeCount: z.number().optional(),
  attendees_public: z.boolean().optional(),
  attendees: z
    .array(
      z.object({
        id: z.string(),
        avatarUrl: z.string().optional(),
        name: z.string(),
        username: z.string().nullable().optional(),
      }),
    )
    .optional(),
  isBookmarked: z.boolean().optional(),
})

export const backendEventListResponseSchema = z.object({
  data: z.array(backendEventSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    total_pages: z.number(),
  }),
})

export type BackendTag = z.infer<typeof backendTagSchema>
export type BackendTicket = z.infer<typeof backendTicketSchema>
export type BackendEvent = z.infer<typeof backendEventSchema>
export type BackendEventListResponse = z.infer<typeof backendEventListResponseSchema>
