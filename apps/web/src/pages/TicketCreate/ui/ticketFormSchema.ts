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
  })

export type TicketForm = z.input<typeof ticketFormSchema>
