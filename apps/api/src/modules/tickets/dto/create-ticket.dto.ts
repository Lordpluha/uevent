import z from 'zod'
import { TicketStatus } from '../entities/ticket.entity'

export const CreateTicketDtoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  datetime_start: z.coerce.date(),
  datetime_end: z.coerce.date(),
  price: z.coerce.number().nonnegative(),
  quantity_limited: z.coerce.boolean().optional(),
  quantity_total: z.coerce.number().int().positive().optional(),
  private_info: z.string().optional(),
  image: z.string().optional(),
  event_id: z.string().uuid(),
  status: z.nativeEnum(TicketStatus).optional(),
})

export type CreateTicketDto = z.infer<typeof CreateTicketDtoSchema>
