import { BasicClientApi } from '@shared/api';
import type { Organization, OrganizationList } from '../model/organizationEntity';
import type { CreateOrganizationDto, UpdateOrganizationDto, OrganizationListParams } from '../model/dtos';
import type { BackendOrganization, BackendOrgListResponse } from '../model/responses';

/* ── Map raw backend org to frontend Organization ────────── */
function mapOrg(raw: BackendOrganization): Organization {
  return {
    id: raw.id,
    title: raw.name ?? '',
    href: raw.href ?? `/organizations/${raw.id}`,
    avatarUrl: raw.avatar ?? undefined,
    coverUrl: raw.coverUrl ?? undefined,
    description: raw.description ?? undefined,
    location: raw.city ?? undefined,
    website: raw.website ?? undefined,
    category: raw.category ?? 'Other',
    foundedAt: raw.foundedAt ?? '',
    membersCount: raw.membersCount ?? 0,
    eventsCount: raw.eventsCount ?? 0,
    followers: raw.followers ?? 0,
    verified: raw.verified ?? false,
  };
}

class OrganizationApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: OrganizationListParams): Promise<OrganizationList> {
    const res = await this.http.get<BackendOrgListResponse>(this.basePath, { params });
    return (res.data.data ?? []).map(mapOrg);
  }

  async getOne(id: string): Promise<Organization> {
    const res = await this.http.get<BackendOrganization>(`${this.basePath}/${id}`);
    return mapOrg(res.data);
  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateOrganizationDto): Promise<Organization> {
    return (await this.http.post<Organization>(this.basePath, body)).data;
  }

  async update(id: string, body: UpdateOrganizationDto): Promise<Organization> {
    return (await this.http.put<Organization>(`${this.basePath}/${id}`, body)).data;
  }

  async patch(id: string, body: Partial<UpdateOrganizationDto>): Promise<Organization> {
    return (await this.http.patch<Organization>(`${this.basePath}/${id}`, body)).data;
  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(id: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${id}`);
  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async uploadLogo(id: string, file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData();
    form.append('logo', file);
    return (await this.http.post<{ avatarUrl: string }>(`${this.basePath}/${id}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }

  async uploadCover(id: string, file: File): Promise<{ coverUrl: string }> {
    const form = new FormData();
    form.append('cover', file);
    return (await this.http.post<{ coverUrl: string }>(`${this.basePath}/${id}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }

  async setFollow(id: string, follow: boolean): Promise<void> {
    if (follow) {
      await this.http.post(`${this.basePath}/${id}/follow`);
    } else {
      await this.http.delete(`${this.basePath}/${id}/follow`);
    }
  }

  async getMe(): Promise<Organization> {
    return (await this.http.get<Organization>(`${this.basePath}/me`)).data;
  }
}

export const organizationsApi = new OrganizationApi('/organizations');
