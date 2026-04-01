import { BasicClientApi } from '@shared/api';
import type { TicketModel, TicketList } from '../model/ticketEntity';
import type { CreateTicketDto, UpdateTicketDto, TicketListParams } from '../model/dtos';

export type ProfileTicket = {
  id: string;
  name: string;
  price: number | string;
  status: 'DRAFT' | 'READY' | 'RESERVED' | 'PAID';
  datetime_start?: string;
  event?: {
    id?: string;
    name?: string;
  };
};

export type ProfileTicketListResponse = {
  data: ProfileTicket[];
};

class TicketApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: TicketListParams): Promise<TicketList> {
    return (await this.http.get<TicketList>(this.basePath, { params })).data;
  }

  async getOne(id: string): Promise<TicketModel> {
    return (await this.http.get<TicketModel>(`${this.basePath}/${id}`)).data;
  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateTicketDto): Promise<TicketModel> {
    return (await this.http.post<TicketModel>(this.basePath, body)).data;
  }

  async update(id: string, body: UpdateTicketDto): Promise<TicketModel> {
    return (await this.http.put<TicketModel>(`${this.basePath}/${id}`, body)).data;
  }

  async patch(id: string, body: Partial<UpdateTicketDto>): Promise<TicketModel> {
    return (await this.http.patch<TicketModel>(`${this.basePath}/${id}`, body)).data;
  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(id: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${id}`);
  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async getMine(params?: TicketListParams): Promise<TicketList> {
    return (await this.http.get<TicketList>(`${this.basePath}/me`, { params })).data;
  }

  async getByUser(userId: string, params?: { page?: number; limit?: number }): Promise<ProfileTicketListResponse> {
    return (
      await this.http.get<ProfileTicketListResponse>(this.basePath, {
        params: { user_id: userId, ...params },
      })
    ).data;
  }

  async purchase(ticketId: string): Promise<TicketModel> {
    return (await this.http.post<TicketModel>(`${this.basePath}/${ticketId}/purchase`)).data;
  }
}

export const ticketsApi = new TicketApi('/tickets');
