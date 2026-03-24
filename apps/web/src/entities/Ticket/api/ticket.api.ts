import { BasicClientApi } from '@shared/api';
import type { TicketModel, TicketList } from '../model/ticketEntity';
import type { CreateTicketDto, UpdateTicketDto, TicketListParams } from '../model/dtos';

/* ── Mock data (swap Promise.resolve → this.$* when backend is ready) ─── */

export const MOCK_TICKETS: TicketModel[] = [
  {
    ticketType: 'standard',
    price: 12,
    eventTitle: 'React Kyiv Meetup #12',
    eventDate: 'Apr 12, 2026',
    eventTime: '10:00',
    location: 'Unit.City, Kyiv',
    format: 'offline',
    status: 'available',
  },
  {
    ticketType: 'vip',
    price: 89,
    eventTitle: 'Design Systems Conference 2026',
    eventDate: 'May 3, 2026',
    eventTime: '09:00',
    location: 'Online',
    format: 'online',
    seat: 'VIP-01',
    status: 'available',
  },
  {
    ticketType: 'standard',
    price: 20,
    eventTitle: 'Node.js Workshop: Streams & Performance',
    eventDate: 'May 17, 2026',
    eventTime: '11:00',
    location: 'UNIT.City Hub, Floor 3',
    format: 'offline',
    status: 'limited',
  },
  {
    ticketType: 'free',
    price: 0,
    eventTitle: 'Web Performance Summit',
    eventDate: 'Jun 7, 2026',
    eventTime: '14:00',
    location: 'Online',
    format: 'online',
    status: 'available',
  },
];

/* ── API class ────────────────────────────────────────────────────────── */

class TicketApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: TicketListParams): Promise<TicketList> {
    let results = MOCK_TICKETS;
    if (params?.status) results = results.filter((t) => t.status === params.status);
    return Promise.resolve(results);
    // return (await this.http.get<TicketList>(this.basePath, { params })).data;

  }

  async getOne(_id: string): Promise<TicketModel> {
    return Promise.resolve(MOCK_TICKETS[0]);
    // return (await this.http.get<TicketModel>(`${this.basePath}/${_id}`)).data;

  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateTicketDto): Promise<TicketModel> {
    const next: TicketModel = {
      ticketType: body.ticketType,
      price: body.price,
      currency: body.currency,
      seat: body.seat,
      eventTitle: `Event #${body.eventId}`,
      eventDate: '',
      eventTime: '',
      location: '',
      format: 'offline',
      status: 'available',
    };
    MOCK_TICKETS.push(next);
    return Promise.resolve(next);
    // return (await this.http.post<TicketModel>(this.basePath, body)).data;

  }

  async update(_id: string, body: UpdateTicketDto): Promise<TicketModel> {
    Object.assign(MOCK_TICKETS[0], body);
    return Promise.resolve({ ...MOCK_TICKETS[0] });
    // return (await this.http.put<TicketModel>(`${this.basePath}/${_id}`, body)).data;

  }

  async patch(_id: string, body: Partial<UpdateTicketDto>): Promise<TicketModel> {
    return this.update(_id, body as UpdateTicketDto);
    // return (await this.http.patch<TicketModel>(`${this.basePath}/${_id}`, body)).data;

  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(_id: string): Promise<void> {
    return Promise.resolve();
    // return (await this.http.delete(`${this.basePath}/${_id}`)).data;

  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async getMine(params?: TicketListParams): Promise<TicketList> {
    return this.getAll(params);
    // return (await this.http.get<TicketList>(`${this.basePath}/me`, { params })).data;

  }

  async purchase(_ticketId: string): Promise<TicketModel> {
    return Promise.resolve(MOCK_TICKETS[0]);
    // return (await this.http.post<TicketModel>(`${this.basePath}/${_ticketId}/purchase`)).data;

  }
}

export const ticketsApi = new TicketApi('/tickets');
