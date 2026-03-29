import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type AuthAccountType = 'user' | 'organization';

type AuthState = {
  isAuthenticated: boolean;
  accountType: AuthAccountType | null;
};

export type AuthContextValue = AuthState & {
  isReady: boolean;
  setAuthenticated: (type: AuthAccountType) => void;
  logout: () => void;
};

const STORAGE_KEY = 'auth';

function readStorage(): AuthState {
  if (typeof window === 'undefined') return { isAuthenticated: false, accountType: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : { isAuthenticated: false, accountType: null };
  } catch {
    return { isAuthenticated: false, accountType: null };
  }
}

/**
 * Module-level singleton — keeps auth state accessible outside React (e.g. axios interceptors).
 * Seeded from localStorage at import time so it's valid before AuthProvider mounts.
 */
const _ref: AuthContextValue = {
  ...readStorage(),
  isReady: true,
  setAuthenticated: () => {},
  logout: () => {},
};

/** Read auth state outside React (e.g. axios interceptors). */
export const getAuthState = () => _ref;

const AuthContext = createContext<AuthContextValue>(_ref);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start unauthenticated to match SSR output, then hydrate from localStorage
  const [state, setState] = useState<AuthState>({ isAuthenticated: false, accountType: null });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readStorage();
    setState(stored);
    _ref.isAuthenticated = stored.isAuthenticated;
    _ref.accountType = stored.accountType;
    _ref.isReady = true;
    setIsReady(true);
  }, []);

  const setAuthenticated = useCallback((accountType: AuthAccountType) => {
    const next: AuthState = { isAuthenticated: true, accountType };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    _ref.isAuthenticated = next.isAuthenticated;
    _ref.accountType = next.accountType;
    _ref.isReady = true;
    setIsReady(true);
  }, []);

  const logout = useCallback(() => {
    const next: AuthState = { isAuthenticated: false, accountType: null };
    setState(next);
    localStorage.removeItem(STORAGE_KEY);
    _ref.isAuthenticated = next.isAuthenticated;
    _ref.accountType = next.accountType;
    _ref.isReady = true;
    setIsReady(true);
  }, []);

  // Keep module-level ref actions in sync (stable refs due to useCallback([]))
  _ref.setAuthenticated = setAuthenticated;
  _ref.logout = logout;
  _ref.isReady = isReady;

  return (
    <AuthContext.Provider value={{ ...state, isReady, setAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
