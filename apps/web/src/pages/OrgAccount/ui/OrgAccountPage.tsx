import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { Building2, Camera, ChevronLeft, ImagePlus, PlusCircle, ShieldCheck, Ticket } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOrg } from '@entities/Organization';
import { organizationsApi } from '@entities/Organization';
import { useEvents } from '@entities/Event';
import { useMyOrg } from '@entities/Organization';
import { useAuth } from '@shared/lib/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Switch,
  Textarea,
} from '@shared/components';

export function OrgAccountPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isAuthenticated, accountType } = useAuth();
  const { data: org, isLoading, isError } = useOrg(id ?? '');
  const { data: myOrg, isLoading: myOrgLoading } = useMyOrg();
  const { data: orgEventsResult } = useEvents(org ? { organization_id: org.id, page: 1, limit: 20 } : undefined);
  const orgEvents = orgEventsResult?.data ?? [];

  const [profileForm, setProfileForm] = useState({
    title: '',
    slogan: '',
    description: '',
    category: '',
    location: '',
    phone: '',
  });
  const [email, setEmail] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [savedTwoFactorEnabled, setSavedTwoFactorEnabled] = useState(false);
  const [isEnableTwoFaDialogOpen, setIsEnableTwoFaDialogOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!org) return;
    setProfileForm({
      title: org.title ?? '',
      slogan: org.slogan ?? '',
      description: org.description ?? '',
      category: org.category ?? '',
      location: org.location ?? '',
      phone: org.phone ?? '',
    });
    setEmail(org.email ?? '');
    const initialTwoFa = org.twoFactorEnabled ?? false;
    setTwoFactorEnabled(initialTwoFa);
    setSavedTwoFactorEnabled(initialTwoFa);
  }, [org]);

  const invalidateOrgQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['organizations'] }),
      queryClient.invalidateQueries({ queryKey: ['organizations', id] }),
      queryClient.invalidateQueries({ queryKey: ['myOrg'] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
    ]);
  };

  const saveProfileMutation = useMutation({
    mutationFn: () => organizationsApi.updateMyProfile({
      title: profileForm.title,
      slogan: profileForm.slogan,
      description: profileForm.description,
      category: profileForm.category,
      location: profileForm.location,
      phone: profileForm.phone,
    }),
    onSuccess: async () => {
      await invalidateOrgQueries();
      toast.success('Organization profile updated');
    },
    onError: () => toast.error('Failed to update organization profile'),
  });

  const saveEmailMutation = useMutation({
    mutationFn: () => organizationsApi.updateMyEmail({ email }),
    onSuccess: async () => {
      await invalidateOrgQueries();
      toast.success('Organization email updated');
    },
    onError: () => toast.error('Failed to update email'),
  });

  const savePasswordMutation = useMutation({
    mutationFn: () => organizationsApi.changeMyPassword(passwordForm),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '' });
      toast.success('Password updated');
    },
    onError: () => toast.error('Failed to update password'),
  });

  const saveSecurityMutation = useMutation({
    mutationFn: (enabled: boolean) => organizationsApi.updateMySecurity({ twoFactorEnabled: enabled }),
    onSuccess: async (_, enabled) => {
      await invalidateOrgQueries();
      setSavedTwoFactorEnabled(enabled);
      setIsEnableTwoFaDialogOpen(false);
      toast.success('Security settings updated');
    },
    onError: () => toast.error('Failed to update security settings'),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => {
      if (!org?.id) throw new Error('Organization id is missing');
      return organizationsApi.uploadLogo(org.id, file);
    },
    onSuccess: async () => {
      await invalidateOrgQueries();
      toast.success('Organization logo updated');
    },
    onError: () => toast.error('Failed to upload organization logo'),
  });

  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => {
      if (!org?.id) throw new Error('Organization id is missing');
      return organizationsApi.uploadCover(org.id, file);
    },
    onSuccess: async () => {
      await invalidateOrgQueries();
      toast.success('Organization cover updated');
    },
    onError: () => toast.error('Failed to upload organization cover'),
  });

  const submitSecuritySettings = () => {
    saveSecurityMutation.mutate(twoFactorEnabled);
  };

  const handleSecuritySaveClick = () => {
    if (!savedTwoFactorEnabled && twoFactorEnabled) {
      setIsEnableTwoFaDialogOpen(true);
      return;
    }

    submitSecuritySettings();
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogoMutation.mutate(file);
    e.target.value = '';
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadCoverMutation.mutate(file);
    e.target.value = '';
  };

  if (!isAuthenticated || accountType !== 'organization') {
    return <Navigate to="/" replace />;
  }

  if (myOrgLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (id && myOrg?.id !== id) {
    return <Navigate to={myOrg ? `/profile/organization/${myOrg.id}` : '/'} replace />;
  }

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading organization profile...</p>
      </main>
    );
  }

  if (!org || isError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">🏢</p>
        <h1 className="text-xl font-semibold">Organization profile unavailable</h1>
        <Link to="/organizations" className="text-sm text-primary hover:underline">
          ← Back to organizations
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <AlertDialog open={isEnableTwoFaDialogOpen} onOpenChange={setIsEnableTwoFaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm to enable 2FA for your organization account and add an extra sign-in protection layer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saveSecurityMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitSecuritySettings} disabled={saveSecurityMutation.isPending}>
              {saveSecurityMutation.isPending ? 'Enabling...' : 'Enable 2FA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Link
        to={`/organizations/${org.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to public org page
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">Organization dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Manage profile, account security and event workflow.</p>

      <section className="mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-linear-to-r from-primary/15 via-primary/5 to-transparent p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary/80">Quick action</p>
            <h2 className="mt-1 text-lg font-semibold">Launch a new event</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start from essentials, set map or online link, then publish.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link to={`/events/create?organizationId=${org.id}`}>
              <Button className="h-11 gap-2 rounded-full px-6 shadow-lg shadow-primary/30">
                <PlusCircle className="h-4 w-4" />
                Create event
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" className="h-11 rounded-full px-5">
                Browse events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 rounded-xl border border-border/60 bg-card p-5 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
          <div className="mt-2 flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-4 w-4 text-primary" />
            {org.title}
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Published events</p>
          <p className="mt-2 text-2xl font-semibold">{orgEvents.length}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Security</p>
          <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {twoFactorEnabled ? '2FA enabled' : '2FA disabled'}
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3 rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 text-base font-semibold">
          <Building2 className="h-4 w-4 text-primary" />
          Event management
        </div>

        <div className="pt-2">
          <p className="mb-2 text-sm font-medium">Events</p>
          {orgEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet. Create your first event.</p>
          ) : (
            <div className="space-y-2">
              {orgEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <Link to={`/events/${event.id}`} className="text-xs text-muted-foreground hover:underline">
                      Open event
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/events/${event.id}/tickets/create`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Ticket className="h-4 w-4" />
                        Add ticket
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-base font-semibold">Branding</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update your organization logo and cover image.</p>

        <div className="mt-4 space-y-4">
          <div className="relative h-36 w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
            {org.coverUrl ? (
              <img src={org.coverUrl} alt={`${org.title} cover`} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-linear-to-br from-primary/20 via-primary/10 to-muted" />
            )}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
              disabled={uploadCoverMutation.isPending}
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">
                {uploadCoverMutation.isPending ? 'Uploading cover...' : 'Change cover'}
              </span>
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 rounded-xl">
                <AvatarImage src={org.avatarUrl} alt={org.title} />
                <AvatarFallback className="rounded-xl text-xl font-semibold">{org.title[0]}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow"
                disabled={uploadLogoMutation.isPending}
                aria-label="Change organization logo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium">Organization logo</p>
              <p className="text-xs text-muted-foreground">
                {uploadLogoMutation.isPending ? 'Uploading logo...' : 'Square image, JPG/PNG/WebP, up to 2 MB'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-base font-semibold">Organization profile</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveProfileMutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
              <Input
                id="org-name"
                value={profileForm.title}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Organization name"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org-slogan">Slogan</FieldLabel>
              <Input
                id="org-slogan"
                value={profileForm.slogan}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, slogan: e.target.value }))}
                placeholder="Short slogan"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="org-description">Description</FieldLabel>
            <Textarea
              id="org-description"
              value={profileForm.description}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-24"
              placeholder="Tell attendees about your organization"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="org-category">Category</FieldLabel>
              <Input
                id="org-category"
                value={profileForm.category}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Technology"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org-location">City</FieldLabel>
              <Input
                id="org-location"
                value={profileForm.location}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Kyiv"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org-phone">Phone</FieldLabel>
              <Input
                id="org-phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+380..."
              />
            </Field>
          </div>

          <Button type="submit" disabled={saveProfileMutation.isPending}>
            {saveProfileMutation.isPending ? 'Saving...' : 'Save profile'}
          </Button>
        </form>
      </section>

      <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-base font-semibold">Account settings</h2>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveEmailMutation.mutate();
          }}
        >
          <Field>
            <FieldLabel htmlFor="org-email">Email</FieldLabel>
            <Input
              id="org-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="org@example.com"
            />
            <FieldDescription>Used for sign in and account notifications.</FieldDescription>
          </Field>
          <Button type="submit" variant="outline" disabled={saveEmailMutation.isPending}>
            {saveEmailMutation.isPending ? 'Updating...' : 'Update email'}
          </Button>
        </form>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            savePasswordMutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
            </Field>
          </div>
          <Button type="submit" variant="outline" disabled={savePasswordMutation.isPending}>
            {savePasswordMutation.isPending ? 'Updating...' : 'Change password'}
          </Button>
        </form>
      </section>

      <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-base font-semibold">Security</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra login protection layer for organizers.</p>
          </div>
          <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
        </div>
        <Button
          className="mt-4"
          variant="outline"
          onClick={handleSecuritySaveClick}
          disabled={saveSecurityMutation.isPending}
        >
          {saveSecurityMutation.isPending ? 'Saving...' : 'Save security settings'}
        </Button>
      </section>
    </main>
  );
}
