import { ProfileViewPage } from '@pages/ProfileView'
import { SITE_NAME } from '@shared/config/app'
import { useAuth } from '@shared/lib/auth-context'
import { Navigate } from 'react-router'

export function meta() {
  return [
    { title: `My profile — ${SITE_NAME}` },
    { name: 'description', content: 'View your uevent profile.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ]
}

function ProfileRoute() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) return null
  if (!isAuthenticated) return <Navigate to="/" replace />

  return <ProfileViewPage />
}

export default ProfileRoute
