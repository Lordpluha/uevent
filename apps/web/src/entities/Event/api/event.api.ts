import { BasicClientApi } from '@shared/api'
import type { CreateEventDto, EventListParams, UpdateEventDto } from '../model/dtos'
import type { ApiEvent, ApiEventListResponse } from '../model/eventEntity'

export interface EventComment {
  id: string
  content: string
  created_at: string
  event_id: string
  user_id: string
  user: {
    id: string
    username: string
    first_name: string | null
    last_name: string | null
    avatar: string | null
  } | null
}

class EventApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: EventListParams): Promise<ApiEventListResponse> {
    const paginatedParams: EventListParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      ...params,
    }
    return (await this.http.get<ApiEventListResponse>(this.basePath, { params: paginatedParams })).data
  }

  async getOne(id: string): Promise<ApiEvent> {
    return (await this.http.get<ApiEvent>(`${this.basePath}/${id}`)).data
  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateEventDto): Promise<ApiEvent> {
    return (await this.http.post<ApiEvent>(this.basePath, body)).data
  }

  async update(id: string, body: UpdateEventDto): Promise<ApiEvent> {
    return (await this.http.patch<ApiEvent>(`${this.basePath}/${id}`, body)).data
  }

  async patch(id: string, body: Partial<UpdateEventDto>): Promise<ApiEvent> {
    return (await this.http.patch<ApiEvent>(`${this.basePath}/${id}`, body)).data
  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(id: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${id}`)
  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async setBookmark(id: string, bookmarked: boolean): Promise<void> {
    if (bookmarked) {
      await this.http.post(`${this.basePath}/${id}/bookmark`)
    } else {
      await this.http.delete(`${this.basePath}/${id}/bookmark`)
    }
  }

  async uploadImages(id: string, files: File[]): Promise<{ gallery: string[] }> {
    const form = new FormData()
    for (const file of files) form.append('images', file)
    return (
      await this.http.post<{ gallery: string[] }>(`${this.basePath}/${id}/cover`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data
  }

  async subscribe(id: string): Promise<void> {
    await this.http.post(`${this.basePath}/${id}/subscribe`)
  }

  async unsubscribe(id: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${id}/subscribe`)
  }

  async getSubscription(id: string): Promise<{ subscribed: boolean }> {
    return (await this.http.get<{ subscribed: boolean }>(`${this.basePath}/${id}/subscription`)).data
  }

  async getByOrganization(organizationId: string, params?: EventListParams): Promise<ApiEventListResponse> {
    return this.getAll({ ...params, organization_id: organizationId })
  }

  /* ── COMMENTS ─────────────────────────────────────────── */

  async getComments(
    eventId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: EventComment[]; meta: { total: number; page: number; limit: number; total_pages: number } }> {
    return (await this.http.get(`${this.basePath}/${eventId}/comments`, { params: { page, limit } })).data
  }

  async createComment(eventId: string, content: string): Promise<EventComment> {
    return (await this.http.post(`${this.basePath}/${eventId}/comments`, { content })).data
  }

  async deleteComment(eventId: string, commentId: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${eventId}/comments/${commentId}`)
  }
}

export const eventsApi = new EventApi('/events')
