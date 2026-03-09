import type { Route } from './+types/user';
import { MOCK_USERS } from '@shared/mocks/mock-users';
import { UserProfilePage } from '@pages/UserProfile';

export function meta({ params }: Route.MetaArgs) {
  const user = MOCK_USERS.find((u) => u.id === params.id);
  return [
    { title: user ? `${user.name} — uevent` : 'User — uevent' },
    { name: 'description', content: user?.bio ?? '' },
  ];
}

export default UserProfilePage;
