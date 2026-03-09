import type { Route } from './+types/home';
import { HomePage } from '@pages/Home';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'UEVENT' }, { name: 'description', content: 'Welcome to UEVENT!' }];
}

export default HomePage;
