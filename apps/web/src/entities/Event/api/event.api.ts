import { BasicClientApi } from '@shared/api';
import type { EventModel, EventList, EventFormat } from '../model/eventEntity';
import type { CreateEventDto, UpdateEventDto, EventListParams } from '../model/dtos';
import type { BackendEvent, BackendEventListResponse, BackendTag, BackendTicket } from '../model/responses';

/* ── Map raw backend event to frontend EventModel ────────── */
const TICKET_STATUS_MAP: Record<string, string> = {
  DRAFT: 'available',
  READY: 'available',
  RESERVED: 'limited',
  PAID: 'sold-out',
};

function mapEvent(raw: BackendEvent): EventModel {
  const start = raw.datetime_start ? new Date(raw.datetime_start) : new Date();
  return {
    id: raw.id,
    title: raw.name ?? '',
    imageUrl: raw.gallery?.[0],
    date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    format: (raw.format ?? (raw.location ? 'offline' : 'online')) as EventFormat,
    location: raw.location ?? undefined,
    organizer: raw.organizer ?? 'Unknown organizer',
    rating: raw.rating ?? 0,
    attendeeCount: raw.attendeeCount ?? raw.tickets?.length ?? 0,
    attendees: raw.attendees ?? [],
    isBookmarked: raw.isBookmarked ?? false,
    description: raw.description ?? '',
    tags: (raw.tags ?? []).map((t: BackendTag) => t.name),
    tickets: (raw.tickets ?? []).map((t: BackendTicket) => ({
      ticketType: (t.ticketType ?? 'standard') as 'free' | 'standard' | 'vip',
      price: Number(t.price ?? 0),
      currency: t.currency ?? '$',
      seat: t.seat ?? undefined,
      status: (TICKET_STATUS_MAP[t.status] ?? 'available') as 'available' | 'limited' | 'sold-out',
    })),
    gallery: raw.gallery?.map((src: string) => ({ src, w: 800, h: 600 })),
  };
}

class EventApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: EventListParams): Promise<EventList> {
    const res = await this.http.get<BackendEventListResponse>(this.basePath, { params });
    return (res.data.data ?? []).map(mapEvent);
  }

  async getOne(id: string): Promise<EventModel> {
    const res = await this.http.get<BackendEvent>(`${this.basePath}/${id}`);
    return mapEvent(res.data);
  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateEventDto): Promise<EventModel> {
    return (await this.http.post<EventModel>(this.basePath, body)).data;
  }

  async update(id: string, body: UpdateEventDto): Promise<EventModel> {
    return (await this.http.put<EventModel>(`${this.basePath}/${id}`, body)).data;
  }

  async patch(id: string, body: Partial<UpdateEventDto>): Promise<EventModel> {
    return (await this.http.patch<EventModel>(`${this.basePath}/${id}`, body)).data;
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
