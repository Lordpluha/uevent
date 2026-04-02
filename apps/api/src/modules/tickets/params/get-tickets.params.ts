import z from 'zod'
import { TicketStatus } from '../entities/ticket.entity'

export const GetTicketsParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  event_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
})

export type GetTicketsParams = z.infer<typeof GetTicketsParamsSchema>
