import { api } from './api';

export type AuthResult = { accountType: 'user' | 'organization' };

export const authApi = {
  // Users
  loginUser: (email: string, password: string) =>
    api.post<AuthResult>('/auth/users/login', { email, password }).then((r) => r.data),

  refreshUser: () =>
    api.post<AuthResult>('/auth/users/refresh', {}).then((r) => r.data),

  logoutUser: () => api.delete('/auth/users/logout'),

  registerUser: (payload: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => api.post<AuthResult>('/auth/users/register', payload).then((r) => r.data),

  // Organizations
  loginOrg: (email: string, password: string) =>
    api.post<AuthResult>('/auth/organizations/login', { email, password }).then((r) => r.data),

  refreshOrg: () =>
    api.post<AuthResult>('/auth/organizations/refresh', {}).then((r) => r.data),

  logoutOrg: () => api.delete('/auth/organizations/logout'),

  registerOrg: (payload: {
    name: string;
    email: string;
    password: string;
    slogan?: string;
  }) => api.post<AuthResult>('/auth/organizations/register', payload).then((r) => r.data),

  // Google Calendar
  addToGoogleCalendar: (eventId: string) =>
    api.post<{ calendarEventId: string; htmlLink: string }>(`/auth/google/calendar/${eventId}`).then((r) => r.data),
};
