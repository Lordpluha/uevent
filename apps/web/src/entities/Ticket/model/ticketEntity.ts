import { z } from 'zod';

export const ticketStatusSchema = z.enum(['available', 'limited', 'sold-out']);
export const ticketTypeSchema = z.enum(['free', 'standard', 'vip']);

export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketType = z.infer<typeof ticketTypeSchema>;

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
});

export const ticketListSchema = z.array(ticketSchema);

export type TicketModel = z.infer<typeof ticketSchema>;
export type TicketList = z.infer<typeof ticketListSchema>;
