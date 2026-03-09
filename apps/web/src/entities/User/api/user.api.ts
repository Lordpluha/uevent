import { BasicClientApi } from '@shared/api';
import type { User, UserList } from '../model/userEntity';
import type { CreateUserDto, UpdateUserDto, UserListParams } from '../model/dtos';

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

  async getAll(_params?: UserListParams): Promise<UserList> {
    return Promise.resolve(MOCK_USERS);
    // return (await this.http.get<UserList>(this.basePath, { params: _params })).data;

  }

  async getOne(id: string): Promise<User> {
    const user = MOCK_USERS.find((u) => u.id === id) ?? MOCK_USERS[0];
    return Promise.resolve(user);
    // return (await this.http.get<User>(`${this.basePath}/${id}`)).data;

  }

  /* ── WRITE ────────────────────────────────────────────── */

  async create(body: CreateUserDto): Promise<User> {
    const next: User = {
      id: String(Date.now()),
      name: body.name,
      username: body.username,
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ticketsCount: 0,
      eventsAttended: 0,
      followers: 0,
      following: 0,
      interests: [],
    };
    MOCK_USERS.push(next);
    return Promise.resolve(next);
    // return (await this.http.post<User>(this.basePath, body)).data;

  }

  async update(id: string, body: UpdateUserDto): Promise<User> {
    const idx = MOCK_USERS.findIndex((u) => u.id === id);
    if (idx !== -1) Object.assign(MOCK_USERS[idx], body);
    return Promise.resolve(MOCK_USERS[idx] ?? MOCK_USERS[0]);
    // return (await this.http.put<User>(`${this.basePath}/${id}`, body)).data;

  }

  async patch(id: string, body: Partial<UpdateUserDto>): Promise<User> {
    return this.update(id, body as UpdateUserDto);
    // return (await this.http.patch<User>(`${this.basePath}/${id}`, body)).data;

  }

  /* ── DELETE ───────────────────────────────────────────── */

  async remove(_id: string): Promise<void> {
    return Promise.resolve();
    // return (await this.http.delete(`${this.basePath}/${_id}`)).data;

  }

  /* ── CUSTOM ───────────────────────────────────────────── */

  async getMe(): Promise<User> {
    return Promise.resolve(MOCK_CURRENT_USER);
    // return (await this.http.get<User>(`${this.basePath}/me`)).data;

  }

  async updateMe(body: UpdateUserDto): Promise<User> {
    Object.assign(MOCK_CURRENT_USER, body);
    return Promise.resolve({ ...MOCK_CURRENT_USER });
    // return (await this.http.patch<User>(`${this.basePath}/me`, body)).data;

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
