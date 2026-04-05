// Auth state is now managed via React Context. Re-exported here for backward compatibility.

export type { AuthAccountType, AuthContextValue } from './auth-context'
export { AuthProvider, getAuthState, useAuth } from './auth-context'
