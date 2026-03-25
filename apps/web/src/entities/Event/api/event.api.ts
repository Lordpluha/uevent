import { BasicClientApi } from '@shared/api';
import type { EventModel, EventList, EventFormat } from '../model/eventEntity';
import type { CreateEventDto, UpdateEventDto, EventListParams } from '../model/dtos';
import type { BackendEvent, BackendEventListResponse, BackendTag, BackendTicket } from '../model/responses';

type ApiListResponse<T> = {
  data: T[];
};

type ApiEvent = {
  id: string;
  name: string;
  description?: string | null;
  gallery?: string[] | null;
  datetime_start?: string | Date;
  datetime_end?: string | Date;
  format?: string | null;
  location?: string | null;
  organizer?: string | null;
  attendeeCount?: number | null;
  attendees?: Array<{ id: string; avatarUrl?: string; name: string }>;
  isBookmarked?: boolean;
  organization_id?: string | number | null;
  tags?: Array<{ id: string; name: string }>;
  tickets?: Array<{
    id: number;
    name?: string | null;
    price?: number | string | null;
    status?: string | null;
    ticketType?: string | null;
    currency?: string | null;
    seat?: string | null;
  }>;
};

const mapTicketStatus = (status?: string | null): 'available' | 'limited' | 'sold-out' => {
  switch (status) {
    case 'READY':
    case 'DRAFT':
      return 'available';
    case 'RESERVED':
      return 'limited';
    case 'PAID':
      return 'sold-out';
    default:
      return 'available';
  }
};

const toDisplayDate = (value?: string | Date) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const toDisplayTime = (value?: string | Date) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const mapApiEvent = (event: ApiEvent): EventModel => {
  const firstGalleryImage = event.gallery?.[0];
  const parsedFormat = event.format === 'online' || event.format === 'offline'
    ? event.format
    : undefined;
  const ticketSource = event.tickets ?? [];

  return {
    id: event.id,
    title: event.name,
    imageUrl: firstGalleryImage,
    date: toDisplayDate(event.datetime_start),
    time: toDisplayTime(event.datetime_start),
    format: (parsedFormat ?? (event.location ? 'offline' : 'online')) as EventFormat,
    location: event.location ?? undefined,
    organizer: event.organizer ?? (event.organization_id ? String(event.organization_id) : 'Organizer'),
    rating: 0,
    attendeeCount: event.attendeeCount ?? event.attendees?.length ?? 0,
    attendees: event.attendees ?? [],
    isBookmarked: event.isBookmarked ?? false,
    description: event.description ?? '',
    tags: event.tags?.map((tag) => tag.name) ?? [],
    tickets:
      ticketSource.map((ticket) => ({
        ticketType:
          ticket.ticketType === 'free' || ticket.ticketType === 'standard' || ticket.ticketType === 'vip'
            ? ticket.ticketType
            : Number(ticket.price ?? 0) === 0
              ? 'free'
              : 'standard',
        price: Number(ticket.price ?? 0),
        currency: ticket.currency ?? '$',
        seat: ticket.seat ?? undefined,
        status: mapTicketStatus(ticket.status),
      })),
    gallery:
      event.gallery?.map((src) => ({
        src,
        msrc: src,
        w: 1200,
        h: 800,
      })) ?? [],
  };
};

class EventApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: EventListParams): Promise<EventList> {
    const response = await this.http.get<ApiListResponse<ApiEvent>>(this.basePath, { params });
    let results = response.data.data.map(mapApiEvent);

    if (params?.format) {
      results = results.filter((event) => event.format === params.format);
    }

    if (params?.organization_id !== undefined) {
      const orgId = String(params.organization_id);
      results = results.filter((event) => event.organizer === orgId);
    }

    if (params?.search) {
      const query = params.search.toLowerCase();
      results = results.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          event.location?.toLowerCase().includes(query),
      );
    }

    if (params?.tags?.length) {
      const selectedTags = params.tags;
      results = results.filter((event) => selectedTags.some((tag) => event.tags.includes(tag)));
    }

    if (params?.date_from || params?.date_to) {
      const from = params.date_from ? new Date(params.date_from).getTime() : Number.NEGATIVE_INFINITY;
      const to = params.date_to ? new Date(params.date_to).getTime() : Number.POSITIVE_INFINITY;

      results = results.filter((event) => {
        const eventDate = new Date(event.date).getTime();
        if (Number.isNaN(eventDate)) return true;
        return eventDate >= from && eventDate <= to;
      });
    }

    return results;
  }

  async getOne(id: string): Promise<EventModel> {
    const response = await this.http.get<ApiEvent>(`${this.basePath}/${id}`);
    return mapApiEvent(response.data);
  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateEventDto): Promise<EventModel> {
    const response = await this.http.post<ApiEvent>(this.basePath, body);
    return mapApiEvent(response.data);
  }

  async update(id: string, body: UpdateEventDto): Promise<EventModel> {
    const response = await this.http.patch<ApiEvent>(`${this.basePath}/${id}`, body);
    return mapApiEvent(response.data);
  }

  async patch(id: string, body: Partial<UpdateEventDto>): Promise<EventModel> {
    const response = await this.http.patch<ApiEvent>(`${this.basePath}/${id}`, body);
    return mapApiEvent(response.data);
  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(id: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${id}`);
  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async setBookmark(id: string, bookmarked: boolean): Promise<void> {
    if (bookmarked) {
      await this.http.post(`${this.basePath}/${id}/bookmark`);
    } else {
      await this.http.delete(`${this.basePath}/${id}/bookmark`);
    }
  }

  async uploadCover(id: string, file: File): Promise<{ imageUrl: string }> {
    const form = new FormData();
    form.append('cover', file);
    return (await this.http.post<{ imageUrl: string }>(`${this.basePath}/${id}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }

  async getByOrganization(organizationId: string, params?: EventListParams): Promise<EventList> {
    return this.getAll({ ...params, organization_id: Number(organizationId) });
  }
}

export const eventsApi = new EventApi('/events');
