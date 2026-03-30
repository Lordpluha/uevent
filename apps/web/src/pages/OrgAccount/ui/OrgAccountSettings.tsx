import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Field, FieldDescription, FieldLabel, Input } from '@shared/components';
import { organizationsApi } from '@entities/Organization';
import type { OrgModel } from './types';

interface Props {
  org: OrgModel;
  invalidate: () => Promise<void>;
}

export function OrgAccountSettings({ org, invalidate }: Props) {
  const [email, setEmail] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    if (org) setEmail(org.email ?? '');
  }, [org]);

  const saveEmailMutation = useMutation({
    mutationFn: () => organizationsApi.updateMyEmail({ email }),
    onSuccess: async () => { await invalidate(); toast.success('Organization email updated'); },
    onError: () => toast.error('Failed to update email'),
  });

  const savePasswordMutation = useMutation({
    mutationFn: () => organizationsApi.changeMyPassword(passwordForm),
    onSuccess: () => { setPasswordForm({ currentPassword: '', newPassword: '' }); toast.success('Password updated'); },
    onError: () => toast.error('Failed to update password'),
  });

  return (
    <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-base font-semibold">Account settings</h2>

      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); saveEmailMutation.mutate(); }}>
        <Field>
          <FieldLabel htmlFor="org-email">Email</FieldLabel>
          <Input id="org-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="org@example.com" />
          <FieldDescription>Used for sign in and account notifications.</FieldDescription>
        </Field>
        <Button type="submit" variant="outline" disabled={saveEmailMutation.isPending}>
          {saveEmailMutation.isPending ? 'Updating...' : 'Update email'}
        </Button>
      </form>

      <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); savePasswordMutation.mutate(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="current-password">Current password</FieldLabel>
            <Input id="current-password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <Input id="new-password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
          </Field>
        </div>
        <Button type="submit" variant="outline" disabled={savePasswordMutation.isPending}>
          {savePasswordMutation.isPending ? 'Updating...' : 'Change password'}
        </Button>
      </form>
    </section>
  );
}
