import { BasicClientApi } from '@shared/api';
import type { EventModel, EventList } from '../model/eventEntity';
import type { CreateEventDto, UpdateEventDto, EventListParams } from '../model/dtos';

class EventApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: EventListParams): Promise<EventList> {
    return (await this.http.get<EventList>(this.basePath, { params })).data;
  }

  async getOne(id: string): Promise<EventModel> {
    return (await this.http.get<EventModel>(`${this.basePath}/${id}`)).data;
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
    return this.getAll({ ...params, organizationId });
  }
}

export const eventsApi = new EventApi('/events');
