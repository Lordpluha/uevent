// Auth state is now managed via React Context. Re-exported here for backward compatibility.
export { getAuthState, useAuth, AuthProvider } from './auth-context';
export type { AuthAccountType, AuthContextValue } from './auth-context';
