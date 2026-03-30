import { api } from '@shared/api'
import { toast } from 'sonner'
import type { TicketForm } from './ticketFormSchema'

export async function submitTicket(
  data: TicketForm,
  opts: { ticketType: string; quantityLimited: boolean; eventId: string; onSuccess: () => void },
) {
  try {
    await api.post('/tickets', {
      name: data.name,
      description: data.description || undefined,
      datetime_start: new Date(data.datetimeStart),
      datetime_end: new Date(data.datetimeEnd),
      price: opts.ticketType === 'free' ? 0 : data.price,
      quantity_limited: opts.quantityLimited,
      quantity_total: opts.quantityLimited ? data.quantityTotal : undefined,
      private_info: data.privateInfo || undefined,
      event_id: opts.eventId,
      status: 'READY',
    })
    toast.success('Ticket created')
    opts.onSuccess()
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create ticket'
    toast.error(message)
  }
}
