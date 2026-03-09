import { BasicClientApi } from '@shared/api';
import type { EventModel, EventList } from '../model/eventEntity';
import type { CreateEventDto, UpdateEventDto, EventListParams } from '../model/dtos';

/* ── Mock data (swap Promise.resolve → this.$* when backend is ready) ─── */

export const MOCK_EVENTS: EventModel[] = [
  {
    id: '1',
    title: 'React Kyiv Meetup #12',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
    date: 'Apr 12, 2026',
    time: '10:00',
    format: 'offline',
    location: 'Unit.City, Kyiv',
    organizer: 'JS Ukraine',
    rating: 4.8,
    attendeeCount: 340,
    attendees: [
      { id: 'a1', name: 'Anna' },
      { id: 'a2', name: 'Bohdan' },
      { id: 'a3', name: 'Carla' },
    ],
    isBookmarked: false,
    description:
      'Join us for our 12th React Kyiv meetup! Three talks on React Server Components, state management patterns in 2026, and building design systems at scale. Networking, food & drinks included.',
    tags: ['React', 'JavaScript', 'Frontend'],
    tickets: [
      { ticketType: 'free', price: 0, status: 'available' },
      { ticketType: 'standard', price: 12, status: 'limited' },
      { ticketType: 'vip', price: 49, seat: 'A-7', status: 'available' },
    ],
  },
  {
    id: '2',
    title: 'Design Systems Conference 2026',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop',
    date: 'May 3, 2026',
    time: '09:00',
    format: 'online',
    organizer: 'Figma Community UA',
    rating: 4.6,
    attendeeCount: 1200,
    attendees: [
      { id: 'b1', name: 'Diana' },
      { id: 'b2', name: 'Evan' },
    ],
    isBookmarked: true,
    description:
      'A full-day virtual summit dedicated to design systems: token architecture, component APIs, accessibility patterns, and cross-team collaboration workflows. Featuring speakers from Google, Vercel, and Airbnb.',
    tags: ['Design', 'UI/UX', 'Figma', 'Components'],
    tickets: [
      { ticketType: 'free', price: 0, status: 'available' },
      { ticketType: 'standard', price: 25, status: 'available' },
      { ticketType: 'vip', price: 89, status: 'sold-out' },
    ],
  },
  {
    id: '3',
    title: 'Node.js Workshop: Streams & Performance',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop',
    date: 'May 17, 2026',
    time: '11:00',
    format: 'offline',
    location: 'UNIT.City Hub, Floor 3',
    organizer: 'Kyiv Tech Hub',
    rating: 4.9,
    attendeeCount: 80,
    attendees: [
      { id: 'c1', name: 'Fiona' },
      { id: 'c2', name: 'George' },
      { id: 'c3', name: 'Hanna' },
    ],
    isBookmarked: false,
    description:
      'Hands-on workshop diving deep into Node.js streams, worker threads, and profiling tools. Bring your laptop — we will write real code. Limited seats, practical exercises included.',
    tags: ['Node.js', 'Backend', 'Performance'],
    tickets: [
      { ticketType: 'standard', price: 20, status: 'limited' },
      { ticketType: 'vip', price: 60, seat: 'B-3', status: 'available' },
    ],
  },
  {
    id: '4',
    title: 'Web Performance Summit',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop',
    date: 'Jun 7, 2026',
    time: '14:00',
    format: 'online',
    organizer: 'WebPerf UA',
    rating: 4.5,
    attendeeCount: 560,
    attendees: [{ id: 'd1', name: 'Ivan' }],
    isBookmarked: false,
    description:
      'Everything you need to know about Core Web Vitals, bundle optimization, caching strategies, and edge rendering in 2026. Lightning talks + Q&A sessions.',
    tags: ['Performance', 'Frontend', 'Core Web Vitals'],
    tickets: [
      { ticketType: 'free', price: 0, status: 'available' },
      { ticketType: 'standard', price: 15, status: 'available' },
    ],
  },
  {
    id: '5',
    title: 'TypeScript Deep Dive',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop',
    date: 'Jun 21, 2026',
    time: '13:00',
    format: 'offline',
    location: 'Platforma, Lviv',
    organizer: 'Lviv JS',
    rating: 4.7,
    attendeeCount: 150,
    attendees: [
      { id: 'e1', name: 'Julia' },
      { id: 'e2', name: 'Kira' },
    ],
    isBookmarked: false,
    description:
      'Advanced TypeScript patterns: template literal types, conditional types, infer, variance, and real-world library typing. For intermediate-to-advanced devs.',
    tags: ['TypeScript', 'JavaScript', 'Frontend'],
    tickets: [
      { ticketType: 'free', price: 0, status: 'sold-out' },
      { ticketType: 'standard', price: 18, status: 'available' },
      { ticketType: 'vip', price: 55, seat: 'C-1', status: 'limited' },
    ],
  },
  {
    id: '6',
    title: 'GraphQL & API Design Patterns',
    imageUrl: 'https://images.unsplash.com/photo-1591267990532-e5bdb1b0ceb8?w=800&auto=format&fit=crop',
    date: 'Jul 10, 2026',
    time: '16:00',
    format: 'online',
    organizer: 'API Guild UA',
    rating: 4.4,
    attendeeCount: 290,
    attendees: [{ id: 'f1', name: 'Leo' }],
    isBookmarked: false,
    description:
      'Schema design, federation, subscriptions, and REST vs GraphQL trade-offs revisited. Learn when (not) to use GraphQL and how to build resilient APIs for 2026 backends.',
    tags: ['GraphQL', 'API', 'Backend'],
    tickets: [
      { ticketType: 'free', price: 0, status: 'available' },
      { ticketType: 'standard', price: 10, status: 'available' },
    ],
  },
];

/* ── API class ────────────────────────────────────────────────────────── */

class EventApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: EventListParams): Promise<EventList> {
    let results = MOCK_EVENTS;
    if (params?.organizationId) {
      results = results.filter((e) => e.organizer === params.organizationId);
    }
    if (params?.format) {
      results = results.filter((e) => e.format === params.format);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return Promise.resolve(results);
    // return (await this.http.get<EventList>(this.basePath, { params })).data;

  }

  async getOne(id: string): Promise<EventModel> {
    const event = MOCK_EVENTS.find((e) => e.id === id) ?? MOCK_EVENTS[0];
    return Promise.resolve(event);
    // return (await this.http.get<EventModel>(`${this.basePath}/${id}`)).data;

  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateEventDto): Promise<EventModel> {
    const next: EventModel = {
      id: String(Date.now()),
      title: body.title,
      description: body.description,
      date: body.date,
      time: body.time,
      format: body.format,
      location: body.location,
      imageUrl: body.imageUrl,
      organizer: body.organizationId,
      rating: 0,
      attendeeCount: 0,
      isBookmarked: false,
      tags: body.tags ?? [],
      tickets: [],
    };
    MOCK_EVENTS.push(next);
    return Promise.resolve(next);
    // return (await this.http.post<EventModel>(this.basePath, body)).data;

  }

  async update(id: string, body: UpdateEventDto): Promise<EventModel> {
    const idx = MOCK_EVENTS.findIndex((e) => e.id === id);
    if (idx !== -1) Object.assign(MOCK_EVENTS[idx], body);
    return Promise.resolve(MOCK_EVENTS[idx] ?? MOCK_EVENTS[0]);
    // return (await this.http.put<EventModel>(`${this.basePath}/${id}`, body)).data;

  }

  async patch(id: string, body: Partial<UpdateEventDto>): Promise<EventModel> {
    return this.update(id, body as UpdateEventDto);
    // return (await this.http.patch<EventModel>(`${this.basePath}/${id}`, body)).data;

  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(_id: string): Promise<void> {
    return Promise.resolve();
    // return (await this.http.delete(`${this.basePath}/${_id}`)).data;

  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async setBookmark(id: string, bookmarked: boolean): Promise<void> {
    const event = MOCK_EVENTS.find((e) => e.id === id);
    if (event) event.isBookmarked = bookmarked;
    return Promise.resolve();
    // if (bookmarked) return (await this.http.post(`${this.basePath}/${id}/bookmark`)).data;

    // return (await this.http.delete(`${this.basePath}/${id}/bookmark`)).data;

  }

  async uploadCover(id: string, file: File): Promise<{ imageUrl: string }> {
    const imageUrl = URL.createObjectURL(file);
    const event = MOCK_EVENTS.find((e) => e.id === id);
    if (event) event.imageUrl = imageUrl;
    return Promise.resolve({ imageUrl });
    // const form = new FormData();
    // form.append('cover', file);
    // return (await this.http.post<{ imageUrl: string }>(`${this.basePath}/${id}/cover`, form, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // })).data;

  }

  async getByOrganization(organizationId: string, params?: EventListParams): Promise<EventList> {
    return this.getAll({ ...params, organizationId });
  }
}

export const eventsApi = new EventApi('/events');
