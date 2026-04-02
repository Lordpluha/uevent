import { z } from 'zod'

export const ticketFormSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    ticketType: z.enum(['free', 'standard', 'vip']),
    datetimeStart: z.string().min(1),
    datetimeEnd: z.string().min(1),
    price: z.number().nonnegative(),
    quantityLimited: z.boolean().default(false),
    quantityTotal: z.number().int().positive().optional(),
    privateInfo: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.quantityLimited && !values.quantityTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantityTotal'],
        message: 'Amount is required when ticket quantity is limited',
      })
    }

    const start = new Date(values.datetimeStart)
    const end = new Date(values.datetimeEnd)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['datetimeEnd'],
        message: 'End datetime must be later than start datetime',
      })
    }

    if (values.ticketType === 'free' && values.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Free ticket price must be 0',
      })
    }
  })

export type TicketForm = z.input<typeof ticketFormSchema>
