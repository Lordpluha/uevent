import { Button } from '@shared/components';
import type { Route } from './+types/home';
import { Link } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'UEVENT' }, { name: 'description', content: 'Welcome to UEVENT!' }];
}

export default function Home() {
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      Main Page
      <Button variant="link" className="ml-4" nativeButton={false} render={<Link to={'/auth/login'} />}>
        Login
      </Button>
      <Button variant="link" className="ml-4" nativeButton={false} render={<Link to={'/auth/registration'} />}>
        Register
      </Button>
    </main>
  );
}
