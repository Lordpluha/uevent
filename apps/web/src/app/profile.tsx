import { Navigate } from 'react-router';
import { useMyOrg } from '@entities/Organization';
import { ProfileViewPage } from '@pages/ProfileView';
import { useAuth } from '@shared/lib/auth-context';

export function meta() {
  return [{ title: 'My profile — uevent' }, { name: 'description', content: 'View your uevent profile.' }];
}

function ProfileRoute() {
  const { isAuthenticated, accountType } = useAuth();
  const { data: myOrg, isLoading: myOrgLoading } = useMyOrg();

  if (isAuthenticated && accountType === 'organization') {
    if (myOrgLoading) {
      return (
        <main className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
      );
    }

    if (myOrg?.id) return <Navigate to={`/profile/organization/${myOrg.id}`} replace />;
  }

  return <ProfileViewPage />;
}

export default ProfileRoute;
