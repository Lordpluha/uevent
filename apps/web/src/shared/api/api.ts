import axios from 'axios';
import { getAuthState, clearServerCookies } from '@shared/lib/auth-context';

// In the browser: use Vite proxy (/api → localhost:3000) so cookies are same-origin.
// In SSR: connect directly to the API server.
const baseURL =
  typeof window === 'undefined'
    ? (import.meta.env.VITE_API_URL ?? 'http://localhost:3000')
    : '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ── Token queue for concurrent 401 handling ─────────────── */
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

const drainQueue = () => {
  for (const cb of refreshQueue) cb();
  refreshQueue = [];
};

/* ── Response interceptor ────────────────────────────────── */
// Cookies (httpOnly) are sent automatically by the browser — no manual token injection needed.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const requestUrl = String(originalRequest?.url ?? '');

    if (!axios.isAxiosError(error) || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Google Calendar 401 means Google OAuth/relink issue, not an app session expiration.
    if (requestUrl.includes('/auth/google/calendar')) {
      return Promise.reject(error);
    }

    const { accountType, isAuthenticated, setAuthenticated, logout } = getAuthState();

    if (!isAuthenticated) {
      logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push(() => resolve(api(originalRequest)));
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const endpoint =
      accountType === 'organization'
        ? '/auth/organizations/refresh'
        : '/auth/users/refresh';

    try {
      // No body — refresh_token cookie is sent automatically via withCredentials
      await api.post(endpoint, {});

      setAuthenticated(accountType ?? 'user');
      drainQueue();

      return api(originalRequest);
    } catch {
      logout();
      refreshQueue = [];
      await clearServerCookies(accountType);
      if (typeof window !== 'undefined') window.location.href = '/';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
