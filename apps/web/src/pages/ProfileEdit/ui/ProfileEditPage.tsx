import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { Separator } from '@shared/components';
import { useMe } from '@entities/User';
import { ProfileEditForm } from './ProfileEditForm';
import { PasswordChangeForm } from './PasswordChangeForm';

export function ProfileEditPage() {
  const { data: user, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </main>
    );
  }

  if (isError || !user) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">⚠️</p>
        <h1 className="text-xl font-semibold">Failed to load profile</h1>
        <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Edit profile</h1>
      <p className="mb-8 text-sm text-muted-foreground">Update your public profile information.</p>

      <ProfileEditForm user={user} />

      <Separator className="my-8" />

      <PasswordChangeForm />
    </main>
  );
}
