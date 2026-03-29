import z from 'zod'
import { TicketStatus } from '../entities/ticket.entity'

export const UpdateTicketDtoSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  datetime_start: z.coerce.date().optional(),
  datetime_end: z.coerce.date().optional(),
  price: z.coerce.number().nonnegative().optional(),
  quantity_limited: z.coerce.boolean().optional(),
  quantity_total: z.coerce.number().int().positive().optional(),
  quantity_sold: z.coerce.number().int().nonnegative().optional(),
  private_info: z.string().optional(),
  image: z.string().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
})

export type UpdateTicketDto = z.infer<typeof UpdateTicketDtoSchema>
