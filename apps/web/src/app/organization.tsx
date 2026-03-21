
import { OrgProfilePage } from '@pages/OrgProfile';

// SSR meta не может быть асинхронным, поэтому используем только id
export const meta = [
  { title: `Organization — uevent` },
  { name: 'description', content: '' },
];

export default OrgProfilePage;
