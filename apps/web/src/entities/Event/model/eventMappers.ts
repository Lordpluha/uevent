import type { ApiEvent, EventFormat, EventModel } from './eventEntity'

export const mapTicketStatus = (status?: string | null): 'available' | 'limited' | 'sold-out' => {
  switch (status) {
    case 'READY':
    case 'DRAFT':
      return 'available'
    case 'RESERVED':
      return 'limited'
    case 'PAID':
      return 'sold-out'
    default:
      return 'available'
  }
}

export const toDisplayDate = (value?: string | Date): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const toDisplayTime = (value?: string | Date): string => {
  if (!value) return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export const mapApiEvent = (event: ApiEvent): EventModel => {
  const firstGalleryImage = event.gallery?.[0]
  const parsedFormat = event.format === 'online' || event.format === 'offline' ? event.format : undefined
  const nowTs = Date.now()
  const ticketSource = (event.tickets ?? []).filter((ticket) => {
    if (!ticket.datetime_end) return true
    const endTs = new Date(ticket.datetime_end).getTime()
    return Number.isNaN(endTs) || endTs >= nowTs
  })

  const toIsoOrUndefined = (value?: string | Date | null) => {
    if (!value) return undefined
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
  }

  const soldFromQuantities = (event.tickets ?? []).reduce((sum, ticket) => {
    const sold = Number(ticket.quantity_sold ?? 0)
    return Number.isFinite(sold) ? sum + Math.max(0, sold) : sum
  }, 0)

  const attendeeCountFromTickets =
    soldFromQuantities > 0
      ? soldFromQuantities
      : (event.tickets ?? []).filter((ticket) => ticket.status === 'PAID' || ticket.user_id).length

  return {
    id: event.id,
    title: event.name,
    imageUrl: firstGalleryImage,
    date: toDisplayDate(event.datetime_start),
    time: toDisplayTime(event.datetime_start),
    format: (parsedFormat ?? (event.location ? 'offline' : 'online')) as EventFormat,
    location: event.location ?? undefined,
    googleMapsUrl: event.location_map_url ?? undefined,
    onlineUrl: event.online_link ?? undefined,
    organizer: event.organizer ?? (event.organization_id ? String(event.organization_id) : '—'),
    organizerOrgId: event.organization_id ? String(event.organization_id) : undefined,
    rating: 0,
    attendeeCount: event.attendeeCount ?? attendeeCountFromTickets ?? event.attendees?.length ?? 0,
    attendeesPublic: event.attendees_public ?? event.attendeesPublic ?? false,
    attendees: event.attendees ?? [],
    isBookmarked: event.isBookmarked ?? false,
    description: event.description ?? '',
    tags: event.tags?.map((tag) => tag.name) ?? [],
    tickets: ticketSource.map((ticket) => ({
      id: String(ticket.id),
      ticketType:
        ticket.ticketType === 'free' || ticket.ticketType === 'standard' || ticket.ticketType === 'vip'
          ? ticket.ticketType
          : Number(ticket.price ?? 0) === 0
            ? 'free'
            : 'standard',
      price: Number(ticket.price ?? 0),
      datetimeStart: toIsoOrUndefined(ticket.datetime_start),
      datetimeEnd: toIsoOrUndefined(ticket.datetime_end),
      currency: ticket.currency ?? undefined,
      seat: ticket.seat ?? undefined,
      quantityLimited: ticket.quantity_limited ?? undefined,
      quantityTotal: ticket.quantity_total ?? undefined,
      quantitySold: ticket.quantity_sold ?? undefined,
      status:
        ticket.quantity_limited && ticket.quantity_total !== null && ticket.quantity_total !== undefined
          ? (ticket.quantity_sold ?? 0) >= ticket.quantity_total
            ? 'sold-out'
            : mapTicketStatus(ticket.status)
          : mapTicketStatus(ticket.status),
    })),
    gallery:
      event.gallery?.map((src) => ({
        src,
        msrc: src,
        w: 1200,
        h: 800,
      })) ?? [],
  }
}
