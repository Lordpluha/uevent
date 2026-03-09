import { BasicClientApi } from '@shared/api';
import type { Organization, OrganizationList } from '../model/organizationEntity';
import type { CreateOrganizationDto, UpdateOrganizationDto, OrganizationListParams } from '../model/dtos';

/* ── Mock data (swap Promise.resolve → this.$* when backend is ready) ─── */

export const MOCK_ORGS: Organization[] = [
  {
    id: '1',
    title: 'JS Ukraine',
    href: '/organizations/1',
    avatarUrl: 'https://i.pravatar.cc/150?img=60',
    coverUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop',
    description: 'The largest JavaScript community in Ukraine. We run regular meetups, workshops and conferences for frontend and full-stack developers.',
    location: 'Kyiv, Ukraine',
    website: 'https://js.ua',
    category: 'Technology',
    foundedAt: 'Jan 2019',
    membersCount: 4200,
    eventsCount: 48,
    followers: 3800,
    verified: true,
  },
  {
    id: '2',
    title: 'Figma Community UA',
    href: '/organizations/2',
    avatarUrl: 'https://i.pravatar.cc/150?img=62',
    coverUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop',
    description: 'Ukrainian Figma community dedicated to UI/UX design education and design systems best practices.',
    location: 'Kyiv, Ukraine',
    website: 'https://figma-ua.com',
    category: 'Design',
    foundedAt: 'May 2021',
    membersCount: 1800,
    eventsCount: 22,
    followers: 1600,
    verified: true,
  },
  {
    id: '3',
    title: 'Kyiv Tech Hub',
    href: '/organizations/3',
    avatarUrl: 'https://i.pravatar.cc/150?img=64',
    coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop',
    description: 'Hands-on workshops and practical training for developers of all levels. We believe in learning by doing.',
    location: 'Kyiv, Ukraine',
    category: 'Technology',
    foundedAt: 'Sep 2020',
    membersCount: 890,
    eventsCount: 31,
    followers: 740,
    verified: false,
  },
  {
    id: '4',
    title: 'WebPerf UA',
    href: '/organizations/4',
    avatarUrl: 'https://i.pravatar.cc/150?img=66',
    description: 'Evangelising web performance in Ukraine. Core Web Vitals, bundle optimization, edge rendering.',
    category: 'Technology',
    foundedAt: 'Mar 2022',
    membersCount: 560,
    eventsCount: 14,
    followers: 480,
    verified: false,
  },
  {
    id: '5',
    title: 'Lviv JS',
    href: '/organizations/5',
    avatarUrl: 'https://i.pravatar.cc/150?img=68',
    description: 'JavaScript & TypeScript meetup group based in Lviv. Monthly gatherings with talks and live coding.',
    location: 'Lviv, Ukraine',
    category: 'Technology',
    foundedAt: 'Jul 2020',
    membersCount: 720,
    eventsCount: 19,
    followers: 640,
    verified: false,
  },
  {
    id: '6',
    title: 'API Guild UA',
    href: '/organizations/6',
    avatarUrl: 'https://i.pravatar.cc/150?img=70',
    description: 'A community focused on API design, GraphQL, REST and backend architecture patterns.',
    category: 'Technology',
    foundedAt: 'Feb 2023',
    membersCount: 390,
    eventsCount: 10,
    followers: 310,
    verified: false,
  },
];

/** The org "owned" by the current user */
export const MOCK_MY_ORG: Organization = MOCK_ORGS[0];

/* ── API class ────────────────────────────────────────────────────────── */

class OrganizationApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(_params?: OrganizationListParams): Promise<OrganizationList> {
    return Promise.resolve(MOCK_ORGS);
    // return (await this.http.get<OrganizationList>(this.basePath, { params: _params })).data;

  }

  async getOne(id: string): Promise<Organization> {
    const org = MOCK_ORGS.find((o) => o.id === id) ?? MOCK_ORGS[0];
    return Promise.resolve(org);
    // return (await this.http.get<Organization>(`${this.basePath}/${id}`)).data;

  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateOrganizationDto): Promise<Organization> {
    const next: Organization = {
      id: String(Date.now()),
      title: body.title,
      href: `/organizations/${Date.now()}`,
      description: body.description,
      category: body.category,
      location: body.location,
      website: body.website,
      foundedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      membersCount: 1,
      eventsCount: 0,
      followers: 0,
      verified: false,
    };
    MOCK_ORGS.push(next);
    return Promise.resolve(next);
    // return (await this.http.post<Organization>(this.basePath, body)).data;

  }

  async update(id: string, body: UpdateOrganizationDto): Promise<Organization> {
    const idx = MOCK_ORGS.findIndex((o) => o.id === id);
    if (idx !== -1) Object.assign(MOCK_ORGS[idx], body);
    return Promise.resolve(MOCK_ORGS[idx] ?? MOCK_ORGS[0]);
    // return (await this.http.put<Organization>(`${this.basePath}/${id}`, body)).data;

  }

  async patch(id: string, body: Partial<UpdateOrganizationDto>): Promise<Organization> {
    return this.update(id, body as UpdateOrganizationDto);
    // return (await this.http.patch<Organization>(`${this.basePath}/${id}`, body)).data;

  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(_id: string): Promise<void> {
    return Promise.resolve();
    // return (await this.http.delete(`${this.basePath}/${_id}`)).data;

  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async uploadLogo(_id: string, file: File): Promise<{ avatarUrl: string }> {
    const avatarUrl = URL.createObjectURL(file);
    const org = MOCK_ORGS.find((o) => o.id === _id);
    if (org) org.avatarUrl = avatarUrl;
    return Promise.resolve({ avatarUrl });
    // const form = new FormData();
    // form.append('logo', file);
    // return (await this.http.post<{ avatarUrl: string }>(`${this.basePath}/${_id}/logo`, form, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // })).data;

  }

  async uploadCover(_id: string, file: File): Promise<{ coverUrl: string }> {
    const coverUrl = URL.createObjectURL(file);
    const org = MOCK_ORGS.find((o) => o.id === _id);
    if (org) org.coverUrl = coverUrl;
    return Promise.resolve({ coverUrl });
    // const form = new FormData();
    // form.append('cover', file);
    // return (await this.http.post<{ coverUrl: string }>(`${this.basePath}/${_id}/cover`, form, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // })).data;

  }

  async setFollow(_id: string, _follow: boolean): Promise<void> {
    return Promise.resolve();
    // if (_follow) return (await this.http.post(`${this.basePath}/${_id}/follow`)).data;

    // return (await this.http.delete(`${this.basePath}/${_id}/follow`)).data;

  }
}

export const organizationsApi = new OrganizationApi('/organizations');
