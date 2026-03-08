import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Login' }, { name: 'description', content: 'Login to UEVENT' }];
}

export default function Login() {
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      Login page is coming soon!
    </main>
  );
}
