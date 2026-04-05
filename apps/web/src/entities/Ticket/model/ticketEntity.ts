import { ticketStatusSchema, ticketTypeSchema } from '@shared/lib/ticket-schemas'
import { z } from 'zod'

export type { TicketStatus, TicketType } from '@shared/lib/ticket-schemas'
export { ticketStatusSchema, ticketTypeSchema } from '@shared/lib/ticket-schemas'

export const ticketSchema = z.object({
  ticketType: ticketTypeSchema,
  price: z.number(),
  currency: z.string().optional(),
  eventTitle: z.string(),
  eventDate: z.string(),
  eventTime: z.string(),
  location: z.string(),
  format: z.enum(['online', 'offline']),
  seat: z.string().optional(),
  status: ticketStatusSchema,
})

export const ticketListSchema = z.array(ticketSchema)

export type TicketModel = z.infer<typeof ticketSchema>
export type TicketList = z.infer<typeof ticketListSchema>
