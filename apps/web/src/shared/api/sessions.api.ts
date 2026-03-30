import { api } from './api';

export interface UserSessionInfo {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  location: string | null;
  created_at: string;
  last_active_at: string;
  is_current: boolean;
}

export const sessionsApi = {
  getAll: () =>
    api.get<UserSessionInfo[]>('/auth/users/sessions').then((r) => r.data),

  revoke: (sessionId: string, code?: string) =>
    api.delete(`/auth/users/sessions/${sessionId}`, { data: code ? { code } : undefined }),
};
