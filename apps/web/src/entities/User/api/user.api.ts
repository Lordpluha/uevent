import { BasicClientApi } from '@shared/api';
import type { User, UserList } from '../model/userEntity';
import type { CreateUserDto, UpdateUserDto, UserListParams } from '../model/dtos';

class UserApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: UserListParams): Promise<UserList> {
    return (await this.http.get<UserList>(this.basePath, { params })).data;
  }

  async getOne(id: string): Promise<User> {
    return (await this.http.get<User>(`${this.basePath}/${id}`)).data;
  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateUserDto): Promise<User> {
    return (await this.http.post<User>(this.basePath, body)).data;
  }

  async update(id: string, body: UpdateUserDto): Promise<User> {
    return (await this.http.put<User>(`${this.basePath}/${id}`, body)).data;
  }

  async patch(id: string, body: Partial<UpdateUserDto>): Promise<User> {
    return (await this.http.patch<User>(`${this.basePath}/${id}`, body)).data;
  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(id: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${id}`);
  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async getMe(): Promise<User> {
    return (await this.http.get<User>(`${this.basePath}/me`)).data;
  }

  async updateMe(body: UpdateUserDto): Promise<User> {
    return (await this.http.patch<User>(`${this.basePath}/me`, body)).data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.http.post(`${this.basePath}/me/change-password`, { currentPassword, newPassword });
  }

  async set2fa(enabled: boolean): Promise<void> {
    await this.http.post(`${this.basePath}/me/2fa`, { enabled });
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData();
    form.append('avatar', file);
    return (await this.http.post<{ avatarUrl: string }>(`${this.basePath}/me/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  }
}

export const usersApi = new UserApi('/users');
