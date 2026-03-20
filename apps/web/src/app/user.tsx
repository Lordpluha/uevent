
import { UserProfilePage } from '@pages/UserProfile';

// SSR meta не может быть асинхронным, поэтому используем только id
export const meta = [
  { title: 'User — uevent' },
  { name: 'description', content: '' },
];

export default UserProfilePage;
