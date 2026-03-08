import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'Registration' }, { name: 'description', content: 'Register to UEVENT' }];
}

export default function Registration() {
	return (
		<main className="flex items-center justify-center pt-16 pb-4">
			Registration page is coming soon!
		</main>
	);
}
