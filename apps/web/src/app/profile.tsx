import { Navigate } from 'react-router';
import { ProfileViewPage } from '@pages/ProfileView';
import { useAuth } from '@shared/lib/auth-context';

export function meta() {
  return [{ title: 'My profile — uevent' }, { name: 'description', content: 'View your uevent profile.' }];
}

function ProfileRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return <ProfileViewPage />;
}

export default ProfileRoute;
