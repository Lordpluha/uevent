import { BasicClientApi } from '@shared/api';
import type { ApiEvent, ApiEventListResponse } from '../model/eventEntity';
import type { CreateEventDto, UpdateEventDto, EventListParams } from '../model/dtos';

class EventApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: EventListParams): Promise<ApiEventListResponse> {
    const paginatedParams: EventListParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      ...params,
    };
    return (await this.http.get<ApiEventListResponse>(this.basePath, { params: paginatedParams })).data;
  }

  async getOne(id: string): Promise<ApiEvent> {
    return (await this.http.get<ApiEvent>(`${this.basePath}/${id}`)).data;
  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateEventDto): Promise<ApiEvent> {
    return (await this.http.post<ApiEvent>(this.basePath, body)).data;
  }

  async update(id: string, body: UpdateEventDto): Promise<ApiEvent> {
    return (await this.http.patch<ApiEvent>(`${this.basePath}/${id}`, body)).data;
  }

  async patch(id: string, body: Partial<UpdateEventDto>): Promise<ApiEvent> {
    return (await this.http.patch<ApiEvent>(`${this.basePath}/${id}`, body)).data;
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

  async uploadImages(id: string, files: File[]): Promise<{ gallery: string[] }> {
    const form = new FormData();
    for (const file of files) form.append('images', file);
    return (await this.http.post<{ gallery: string[] }>(`${this.basePath}/${id}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }

  async getByOrganization(organizationId: string, params?: EventListParams): Promise<ApiEventListResponse> {
    return this.getAll({ ...params, organization_id: organizationId });
  }
}


export const eventsApi = new EventApi('/events');
