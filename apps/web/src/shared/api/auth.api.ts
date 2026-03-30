import { api } from './api';

export type AuthResult = { accountType: 'user' | 'organization' };
export type LoginResult = AuthResult | { requires2fa: true; tempToken: string };

export const authApi = {
  // Users
  loginUser: (email: string, password: string) =>
    api.post<LoginResult>('/auth/users/login', { email, password }).then((r) => r.data),

  verify2fa: (tempToken: string, code: string) =>
    api.post<AuthResult>('/auth/users/2fa/verify', { tempToken, code }).then((r) => r.data),

  setup2fa: () =>
    api.post<{ secret: string; qrCodeDataUrl: string }>('/auth/users/2fa/setup').then((r) => r.data),

  confirm2fa: (code: string) =>
    api.post<{ enabled: boolean }>('/auth/users/2fa/confirm', { code }).then((r) => r.data),

  disable2fa: (code: string) =>
    api.post<{ enabled: boolean }>('/auth/users/2fa/disable', { code }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/users/forgot-password', { email }).then((r) => r.data),

  resetPassword: (email: string, code: string, password: string) =>
    api.post<{ message: string }>('/auth/users/reset-password', { email, code, password }).then((r) => r.data),

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
    api.post<LoginResult>('/auth/organizations/login', { email, password }).then((r) => r.data),

  verifyOrg2fa: (tempToken: string, code: string) =>
    api.post<AuthResult>('/auth/organizations/2fa/verify', { tempToken, code }).then((r) => r.data),

  setupOrg2fa: () =>
    api.post<{ secret: string; qrCodeDataUrl: string }>('/auth/organizations/2fa/setup').then((r) => r.data),

  confirmOrg2fa: (code: string) =>
    api.post<{ enabled: boolean }>('/auth/organizations/2fa/confirm', { code }).then((r) => r.data),

  disableOrg2fa: (code: string) =>
    api.post<{ enabled: boolean }>('/auth/organizations/2fa/disable', { code }).then((r) => r.data),

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

  addTicketToGoogleCalendar: (ticketId: string) =>
    api.post<{ calendarEventId: string; htmlLink: string }>(`/auth/google/calendar/ticket/${ticketId}`).then((r) => r.data),
};
