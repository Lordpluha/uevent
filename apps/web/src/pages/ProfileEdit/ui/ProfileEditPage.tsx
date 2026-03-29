import type { ChangeEvent, FormEvent } from 'react';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Camera, ChevronLeft, Eye, EyeOff, Save, Shield, ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
  Input,
  Separator,
  Switch,
  Textarea,
  buttonVariants,
} from '@shared/components';
import { cn } from '@shared/lib/utils';
import { usersApi, useMe } from '@entities/User';

export function ProfileEditPage() {
  const { data: user, isLoading, isError } = useMe();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? '',
      username: user.username ?? '',
      bio: user.bio ?? '',
      location: user.location ?? '',
      website: user.website ?? '',
    });
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
      ]);
      toast.success('Profile photo updated');
    },
    onError: () => {
      toast.error('Failed to upload profile photo');
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        name: form.name.trim() || undefined,
        username: form.username.trim() || undefined,
        bio: form.bio.trim() || undefined,
        location: form.location.trim() || undefined,
        website: form.website.trim() || undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
      ]);
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to save profile');
    },
  });

  // hydrate form when user loads
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        username: user.username,
        bio: user.bio ?? '',
        location: user.location ?? '',
        website: user.website ?? '',
      });
    }
  }, [user]);

  const set =
    (field: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setPass =
    (field: keyof typeof passwordForm) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleShow = (field: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate();
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!passwordForm.current) errs.current = 'Current password is required.';
    if (passwordForm.next.length < 8) errs.next = 'Password must be at least 8 characters.';
    if (passwordForm.next !== passwordForm.confirm) errs.confirm = 'Passwords do not match.';
    setPasswordErrors(errs);
    if (Object.keys(errs).length === 0) {
      toast.info('Password change endpoint is not available on backend yet.');
      setPasswordForm({ current: '', next: '', confirm: '' });
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </main>
    );
  }

  if (isError) {
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

      {/* ── Profile info form ─────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback className="text-xl">{user?.name?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
              title="Change photo"
            >
              <Camera className="h-3 w-3" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-xs text-muted-foreground">JPG, PNG or GIF · max 2 MB</p>
          </div>
        </div>

        <Separator />

        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input id="name" value={form.name} onChange={set('name')} placeholder="Your name" />
            </Field>
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                value={form.username}
                onChange={set('username')}
                placeholder="username"
              />
              <FieldDescription>Used in your public profile URL.</FieldDescription>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="bio">Bio</FieldLabel>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={set('bio')}
              placeholder="Tell something about yourself"
              className="min-h-24"
            />
            <FieldDescription>Max 300 characters.</FieldDescription>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                value={form.location}
                onChange={set('location')}
                placeholder="City, Country"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="website">Website</FieldLabel>
              <Input
                id="website"
                value={form.website}
                onChange={set('website')}
                placeholder="https://your.site"
              />
            </Field>
          </div>
        </FieldGroup>

        <div className="flex justify-end gap-3">
          <Link to="/profile" className={cn(buttonVariants({ variant: 'ghost' }))}>
            Cancel
          </Link>
          <Button type="submit" className="gap-1.5" disabled={saveProfileMutation.isPending}>
            <Save className="h-3.5 w-3.5" />
            {saveProfileMutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>

      <Separator className="my-8" />

      {/* ── Security section ──────────────────────────────────── */}
      <section id="password">
        <h2 className="mb-1 text-base font-semibold">Security</h2>
        <p className="mb-6 text-xs text-muted-foreground">Manage your password and two-factor authentication.</p>

        {/* 2FA toggle */}
        <div className="mb-6 rounded-xl border border-border/60 bg-card p-5">
          <Field orientation="horizontal" className="items-center justify-between">
            <div>
              <FieldTitle className="gap-1.5">
                {twoFaEnabled ? (
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <Shield className="h-4 w-4 text-muted-foreground" />
                )}
                Two-factor authentication (2FA)
              </FieldTitle>
              <FieldDescription className="mt-0.5">
                {twoFaEnabled
                  ? 'Enabled — your account is protected by an authenticator app.'
                  : 'Protect your account with a one-time code from an authenticator app.'}
              </FieldDescription>
            </div>
            <Switch
              checked={twoFaEnabled}
              onCheckedChange={setTwoFaEnabled}
              aria-label="Toggle 2FA"
            />
          </Field>
        </div>

        {/* Change password form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <FieldGroup>
            <Field data-invalid={!!passwordErrors.current || undefined}>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword.current ? 'text' : 'password'}
                  value={passwordForm.current}
                  onChange={setPass('current')}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError errors={passwordErrors.current ? [{ message: passwordErrors.current }] : []} />
            </Field>

            <FieldSeparator />

            <Field data-invalid={!!passwordErrors.next || undefined}>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword.next ? 'text' : 'password'}
                  value={passwordForm.next}
                  onChange={setPass('next')}
                  placeholder="At least 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('next')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError errors={passwordErrors.next ? [{ message: passwordErrors.next }] : []} />
            </Field>

            <Field data-invalid={!!passwordErrors.confirm || undefined}>
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={passwordForm.confirm}
                  onChange={setPass('confirm')}
                  placeholder="Repeat new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError errors={passwordErrors.confirm ? [{ message: passwordErrors.confirm }] : []} />
            </Field>
          </FieldGroup>

          <div className="flex justify-end">
            <Button type="submit" variant="outline" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Update password
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
