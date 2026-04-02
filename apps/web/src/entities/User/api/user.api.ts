import { BasicClientApi } from '@shared/api';
import type { ApiUser, ApiUserListResponse } from '../model/userEntity';
import type { CreateUserDto, UpdateUserDto, UserListParams } from '../model/dtos';

const toBackendUserUpdate = (body: UpdateUserDto) => {
  const fullName = (body.name ?? '').trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return {
    username: body.username,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    location: body.location,
    avatar: body.avatarUrl,
    bio: body.bio,
    website: body.website,
    timezone: body.timezone,
    interests: body.interests,
    notifications_enabled: body.notificationsEnabled,
    push_notifications_enabled: body.pushNotificationsEnabled,
    payment_email_enabled: body.paymentEmailEnabled,
    subscription_notifications_enabled: body.subscriptionNotificationsEnabled,
    login_notifications_enabled: body.loginNotificationsEnabled,
    hidden_from_attendees: body.hiddenFromAttendees,
    two_fa: body.twoFa,
    password: body.password,
  };
};

class UserApi extends BasicClientApi {
  async getAll(params?: UserListParams): Promise<ApiUserListResponse> {
    return (await this.http.get<ApiUserListResponse>(this.basePath, { params })).data;
  }

  async getOne(id: string): Promise<ApiUser> {
    return (await this.http.get<ApiUser>(`${this.basePath}/${id}`)).data;
  }

  async create(body: CreateUserDto): Promise<ApiUser> {
    return (await this.http.post<ApiUser>(this.basePath, body)).data;
  }

  async update(id: string, body: UpdateUserDto): Promise<ApiUser> {
    return (await this.http.patch<ApiUser>(`${this.basePath}/${id}`, toBackendUserUpdate(body))).data;
  }

  async patch(id: string, body: Partial<UpdateUserDto>): Promise<ApiUser> {
    return (await this.http.patch<ApiUser>(`${this.basePath}/${id}`, toBackendUserUpdate(body as UpdateUserDto))).data;
  }

  async remove(id: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${id}`);
  }

  async getMe(): Promise<ApiUser> {
    return (await this.http.get<ApiUser>('/auth/users/me')).data;
  }

  async updateMe(body: UpdateUserDto): Promise<ApiUser> {
    const me = await this.getMe();
    return (await this.http.patch<ApiUser>(`${this.basePath}/${me.id}`, toBackendUserUpdate(body))).data;
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

