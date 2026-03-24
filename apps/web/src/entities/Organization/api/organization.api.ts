import { BasicClientApi } from '@shared/api';
import type { Organization, OrganizationList } from '../model/organizationEntity';
import type { CreateOrganizationDto, UpdateOrganizationDto, OrganizationListParams } from '../model/dtos';
import type { BackendOrganization } from '../model/responses';

type ApiListResponse<T> = {
  data: T[];
};

type ApiOrganization = BackendOrganization;

const toBackendOrgUpdate = (body: UpdateOrganizationDto) => {
  return {
    name: body.title,
    description: body.description,
    category: body.category,
    city: body.location,
    avatar: body.avatarUrl,
  };
};

const toBackendOrgCreate = (body: CreateOrganizationDto) => {
  return {
    name: body.title,
    description: body.description,
    category: body.category,
    city: body.location,
  };
};

const mapApiOrganization = (raw: ApiOrganization): Organization => {
  return {
    id: String(raw.id),
    title: raw.name ?? '',
    href: raw.href ?? `/organizations/${String(raw.id)}`,
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
};

class OrganizationApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: OrganizationListParams): Promise<OrganizationList> {
    const response = await this.http.get<ApiListResponse<ApiOrganization>>(this.basePath, { params });

    let results = response.data.data.map(mapApiOrganization);

    if (params?.search) {
      const query = params.search.toLowerCase();
      results = results.filter(
        (org) =>
          org.title.toLowerCase().includes(query) ||
          org.description?.toLowerCase().includes(query),
      );
    }

    if (params?.category) {
      results = results.filter((org) => org.category === params.category);
    }

    if (params?.verified !== undefined) {
      results = results.filter((org) => org.verified === params.verified);
    }

    return results;
  }

  async getOne(id: string): Promise<Organization> {
    const response = await this.http.get<BackendOrganization>(`${this.basePath}/${id}`);
    return mapApiOrganization(response.data);
  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateOrganizationDto): Promise<Organization> {
    const response = await this.http.post<ApiOrganization>(this.basePath, toBackendOrgCreate(body));
    return mapApiOrganization(response.data);
  }

  async update(id: string, body: UpdateOrganizationDto): Promise<Organization> {
    const response = await this.http.patch<ApiOrganization>(`${this.basePath}/${id}`, toBackendOrgUpdate(body));
    return mapApiOrganization(response.data);
  }

  async patch(id: string, body: Partial<UpdateOrganizationDto>): Promise<Organization> {
    const response = await this.http.patch<ApiOrganization>(`${this.basePath}/${id}`, toBackendOrgUpdate(body as UpdateOrganizationDto));
    return mapApiOrganization(response.data);
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
    const response = await this.http.get<ApiOrganization>(`${this.basePath}/me`);
    return mapApiOrganization(response.data);
  }
}

export const organizationsApi = new OrganizationApi('/organizations');
