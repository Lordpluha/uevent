import { useQuery } from '@tanstack/react-query';
import { BasicClientApi } from '@shared/api';
import type { User, UserList } from '../model/userEntity';
import type { CreateUserDto, UpdateUserDto, UserListParams } from '../model/dtos';

type ApiListResponse<T> = {
  data: T[];
};

type ApiUser = {
  id: number;
  username: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  location?: string | null;
  avatar?: string | null;
};

const mapApiUser = (user: ApiUser): User => {
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  const displayName = fullName || user.username || `User #${user.id}`;

  return {
    id: String(user.id),
    name: displayName,
    username: user.username,
    avatarUrl: user.avatar ?? undefined,
    bio: undefined,
    location: user.location ?? undefined,
    website: undefined,
    joinedAt: 'Recently',
    ticketsCount: 0,
    eventsAttended: 0,
    followers: 0,
    following: 0,
    interests: [],
  };
};

/* ── Mock data (swap Promise.resolve → this.$* when backend is ready) ─── */

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Anna Kovalenko',
    username: 'anna_k',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    bio: 'Frontend developer & UI enthusiast. Love attending tech meetups and design events.',
    location: 'Kyiv, Ukraine',
    website: 'https://anna.dev',
    joinedAt: 'Jan 2024',
    ticketsCount: 12,
    eventsAttended: 18,
    followers: 340,
    following: 120,
    interests: ['React', 'Design', 'TypeScript', 'Frontend'],
  },
  {
    id: '2',
    name: 'Bohdan Marchenko',
    username: 'bohdan_m',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    bio: 'Backend engineer. Node.js & GraphQL. Conference speaker.',
    location: 'Lviv, Ukraine',
    joinedAt: 'Mar 2023',
    ticketsCount: 7,
    eventsAttended: 11,
    followers: 210,
    following: 88,
    interests: ['Node.js', 'GraphQL', 'Backend', 'APIs'],
  },
  {
    id: '3',
    name: 'Carla Schmidt',
    username: 'carla_s',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    bio: 'Product designer. Building accessible, beautiful interfaces.',
    location: 'Berlin, Germany',
    website: 'https://carlaschmidt.design',
    joinedAt: 'Jun 2024',
    ticketsCount: 4,
    eventsAttended: 6,
    followers: 95,
    following: 60,
    interests: ['Design', 'Figma', 'Accessibility', 'UI/UX'],
  },
];

/** The "current user" for authenticated views */
export const MOCK_CURRENT_USER: User = MOCK_USERS[0];

/* ── API class ────────────────────────────────────────────────────────── */

class UserApi extends BasicClientApi {
  /* ── READ ─────────────────────────────────────────────── */

  async getAll(params?: UserListParams): Promise<UserList> {
    const requestParams: Record<string, string | number> = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
    };

    const response = await this.http.get<ApiListResponse<ApiUser>>(this.basePath, {
      params: requestParams,
    });

    return response.data.data.map(mapApiUser);
  }

  async getOne(id: string): Promise<User> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      throw new Error('Invalid user id');
    }

    const response = await this.http.get<ApiUser>(`${this.basePath}/${numericId}`);
    return mapApiUser(response.data);

  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateUserDto): Promise<User> {
    const response = await this.http.post<ApiUser>(this.basePath, body);
    return mapApiUser(response.data);

  }

  async update(id: string, body: UpdateUserDto): Promise<User> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      throw new Error('Invalid user id');
    }
    const response = await this.http.patch<ApiUser>(`${this.basePath}/${numericId}`, body);
    return mapApiUser(response.data);

  }

  async patch(id: string, body: Partial<UpdateUserDto>): Promise<User> {
    return this.update(id, body as UpdateUserDto);
    // return (await this.http.patch<User>(`${this.basePath}/${id}`, body)).data;

  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(id: string): Promise<void> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      throw new Error('Invalid user id');
    }
    await this.http.delete(`${this.basePath}/${numericId}`);

  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async getMe(): Promise<User> {
    const users = await this.getAll({ page: 1, limit: 1 });
    return users[0] ?? MOCK_CURRENT_USER;

  }

  async updateMe(body: UpdateUserDto): Promise<User> {
    const me = await this.getMe();
    return this.update(me.id, body);

  }

  async changePassword(_currentPassword: string, _newPassword: string): Promise<void> {
    return Promise.resolve();
    // return (await this.http.post(`${this.basePath}/me/change-password`, { currentPassword: _currentPassword, newPassword: _newPassword })).data;

  }

  async set2fa(_enabled: boolean): Promise<void> {
    return Promise.resolve();
    // return (await this.http.post(`${this.basePath}/me/2fa`, { enabled: _enabled })).data;

  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const avatarUrl = URL.createObjectURL(file);
    MOCK_CURRENT_USER.avatarUrl = avatarUrl;
    return Promise.resolve({ avatarUrl });
    // const form = new FormData();
    // form.append('avatar', file);
    // return (await this.http.post<{ avatarUrl: string }>(`${this.basePath}/me/avatar`, form, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // })).data;

  }
}

export const usersApi = new UserApi('/users');

export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: ['users', params ?? {}],
    queryFn: () => usersApi.getAll(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getOne(id),
    enabled: !!id,
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
  });
}
