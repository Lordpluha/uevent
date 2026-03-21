
import { OrgEditPage } from '@pages/OrgEdit';

// SSR meta не может быть асинхронным, поэтому используем только id
export const meta = [
  { title: 'Edit organization — uevent' },
];

export default OrgEditPage;
