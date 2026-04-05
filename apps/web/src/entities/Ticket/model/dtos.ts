import { ticketStatusSchema, ticketTypeSchema } from '@shared/lib/ticket-schemas'
import { z } from 'zod'

export const createTicketSchema = z.object({
  eventId: z.string().min(1),
  ticketType: ticketTypeSchema,
  price: z.number().nonnegative(),
  currency: z.string().optional(),
  seat: z.string().optional(),
  totalCount: z.number().int().positive(),
})

export const updateTicketSchema = z.object({
  price: z.number().nonnegative().optional(),
  ticketType: ticketTypeSchema.optional(),
  seat: z.string().optional(),
  totalCount: z.number().int().positive().optional(),
})

export const ticketListParamsSchema = z.object({
  eventId: z.string().optional(),
  userId: z.string().optional(),
  status: ticketStatusSchema.optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
})

export type CreateTicketDto = z.infer<typeof createTicketSchema>
export type UpdateTicketDto = z.infer<typeof updateTicketSchema>
export type TicketListParams = z.infer<typeof ticketListParamsSchema>
