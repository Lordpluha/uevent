import { BasicClientApi } from '@shared/api';
import type { User, UserList } from '../model/userEntity';
import type { CreateUserDto, UpdateUserDto, UserListParams } from '../model/dtos';

type ApiListResponse<T> = {
  data: T[];
};

type ApiUser = {
  id: string | number;
  name?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  joinedAt?: string | null;
  createdAt?: string | null;
  ticketsCount?: number | null;
  eventsAttended?: number | null;
  followers?: number | null;
  following?: number | null;
  interests?: string[] | null;
};

const toBackendUserUpdate = (body: UpdateUserDto) => {
  const fullName = (body.name ?? '').trim();
  const [firstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
  const lastName = rest.join(' ');

  return {
    username: body.username,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    location: body.location,
    avatar: body.avatarUrl,
  };
};

const formatJoinedAt = (value?: string | null): string => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const mapApiUser = (raw: ApiUser): User => {
  const id = String(raw.id);
  const composedName = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim();
  const name = raw.name?.trim() || composedName || `User ${id}`;
  const username = raw.username?.trim() || `user${id}`;

  return {
    id,
    name,
    username,
    avatarUrl: raw.avatarUrl ?? raw.avatar ?? undefined,
    bio: raw.bio ?? undefined,
    location: raw.location ?? undefined,
    website: raw.website ?? undefined,
    joinedAt: formatJoinedAt(raw.joinedAt ?? raw.createdAt),
    ticketsCount: raw.ticketsCount ?? 0,
    eventsAttended: raw.eventsAttended ?? 0,
    followers: raw.followers ?? 0,
    following: raw.following ?? 0,
    interests: raw.interests ?? [],
  };
};

class UserApi extends BasicClientApi {
  async getAll(params?: UserListParams): Promise<UserList> {
    const response = await this.http.get<ApiListResponse<ApiUser>>(this.basePath, { params });
    return response.data.data.map(mapApiUser);
  }

  async getOne(id: string): Promise<User> {
    const response = await this.http.get<ApiUser>(`${this.basePath}/${id}`);
    return mapApiUser(response.data);
  }

  async create(body: CreateUserDto): Promise<User> {
    const response = await this.http.post<ApiUser>(this.basePath, body);
    return mapApiUser(response.data);
  }

  async update(id: string, body: UpdateUserDto): Promise<User> {
    const response = await this.http.patch<ApiUser>(`${this.basePath}/${id}`, toBackendUserUpdate(body));
    return mapApiUser(response.data);
  }

  async patch(id: string, body: Partial<UpdateUserDto>): Promise<User> {
    const response = await this.http.patch<ApiUser>(`${this.basePath}/${id}`, toBackendUserUpdate(body as UpdateUserDto));
    return mapApiUser(response.data);
  }

  async remove(id: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${id}`);
  }

  async getMe(): Promise<User> {
    try {
      const response = await this.http.get<ApiUser>(`${this.basePath}/me`);
      return mapApiUser(response.data);
    } catch {
      const users = await this.getAll({ page: 1, limit: 1 });
      if (users.length > 0) return users[0];
      throw new Error('Current user is not available');
    }
  }

  async updateMe(body: UpdateUserDto): Promise<User> {
    const me = await this.getMe();
    const response = await this.http.patch<ApiUser>(`${this.basePath}/${me.id}`, toBackendUserUpdate(body));
    return mapApiUser(response.data);
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
