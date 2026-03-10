import type { Route } from './+types/organizations';
import { OrgsPage } from '@pages/Organizations';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Organizations — uevent' },
    { name: 'description', content: 'Discover communities and groups organizing events.' },
  ];
}

export default OrgsPage;
