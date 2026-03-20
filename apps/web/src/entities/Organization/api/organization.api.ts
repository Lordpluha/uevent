import { BasicClientApi } from '@shared/api';
import type { Organization, OrganizationList } from '../model/organizationEntity';
import type { CreateOrganizationDto, UpdateOrganizationDto, OrganizationListParams } from '../model/dtos';

class OrganizationApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: OrganizationListParams): Promise<OrganizationList> {
    return (await this.http.get<OrganizationList>(this.basePath, { params })).data;
  }

  async getOne(id: string): Promise<Organization> {
    return (await this.http.get<Organization>(`${this.basePath}/${id}`)).data;
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
