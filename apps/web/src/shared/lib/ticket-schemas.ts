import { z } from 'zod'

export const ticketStatusSchema = z.enum(['available', 'limited', 'sold-out'])
export const ticketTypeSchema = z.enum(['free', 'standard', 'vip'])

export type TicketStatus = z.infer<typeof ticketStatusSchema>
export type TicketType = z.infer<typeof ticketTypeSchema>
