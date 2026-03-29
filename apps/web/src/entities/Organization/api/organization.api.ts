import { BasicClientApi } from '@shared/api';
import type { ApiOrganization, ApiOrganizationListResponse } from '../model/organizationEntity';
import type {
  ChangeOrganizationPasswordDto,
  CreateOrganizationDto,
  OrganizationListParams,
  UpdateOrganizationDto,
  UpdateOrganizationEmailDto,
  UpdateOrganizationSecurityDto,
} from '../model/dtos';

const toBackendOrgUpdate = (body: UpdateOrganizationDto) => ({
  name: body.title,
  slogan: body.slogan,
  description: body.description,
  phone: body.phone,
  category: body.category,
  city: body.location,
  avatar: body.avatarUrl,
});

const toBackendOrgCreate = (body: CreateOrganizationDto) => ({
  name: body.title,
  description: body.description,
  category: body.category,
  city: body.location,
});

class OrganizationApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: OrganizationListParams): Promise<ApiOrganizationListResponse> {
    const paginatedParams: OrganizationListParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      ...params,
    };
    return (await this.http.get<ApiOrganizationListResponse>(this.basePath, { params: paginatedParams })).data;
  }

  async getOne(id: string): Promise<ApiOrganization> {
    return (await this.http.get<ApiOrganization>(`${this.basePath}/${id}`)).data;
  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateOrganizationDto): Promise<ApiOrganization> {
    return (await this.http.post<ApiOrganization>(this.basePath, toBackendOrgCreate(body))).data;
  }

  async update(id: string, body: UpdateOrganizationDto): Promise<ApiOrganization> {
    return (await this.http.patch<ApiOrganization>(`${this.basePath}/${id}`, toBackendOrgUpdate(body))).data;
  }

  async patch(id: string, body: Partial<UpdateOrganizationDto>): Promise<ApiOrganization> {
    return (await this.http.patch<ApiOrganization>(`${this.basePath}/${id}`, toBackendOrgUpdate(body as UpdateOrganizationDto))).data;
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

  async getFollowStatus(id: string): Promise<{ followed: boolean }> {
    return (await this.http.get<{ followed: boolean }>(`${this.basePath}/${id}/following`)).data;
  }

  async getMe(): Promise<ApiOrganization> {
    return (await this.http.get<ApiOrganization>('/auth/organizations/me')).data;
  }

  async updateMyProfile(body: UpdateOrganizationDto): Promise<ApiOrganization> {
    return (await this.http.post<ApiOrganization>('/auth/organizations/settings/profile', toBackendOrgUpdate(body))).data;
  }

  async updateMyEmail(body: UpdateOrganizationEmailDto): Promise<ApiOrganization> {
    return (await this.http.post<ApiOrganization>('/auth/organizations/settings/email', body)).data;
  }

  async changeMyPassword(body: ChangeOrganizationPasswordDto): Promise<{ message: string }> {
    return (await this.http.post<{ message: string }>('/auth/organizations/settings/password', {
      current_password: body.currentPassword,
      new_password: body.newPassword,
    })).data;
  }

  async updateMySecurity(body: UpdateOrganizationSecurityDto): Promise<ApiOrganization> {
    return (await this.http.post<ApiOrganization>('/auth/organizations/settings/security', {
      two_factor_enabled: body.twoFactorEnabled,
    })).data;
  }
}

export const organizationsApi = new OrganizationApi('/organizations');

