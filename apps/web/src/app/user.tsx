import type { Route } from './+types/user';
import { UserProfilePage } from '@pages/UserProfile';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'User — uevent' },
    { name: 'description', content: 'Public user profile' },
  ];
}

export default UserProfilePage;
