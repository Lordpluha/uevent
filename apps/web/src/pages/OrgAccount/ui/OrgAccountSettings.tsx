import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Field, FieldDescription, FieldLabel, Input } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { organizationsApi } from '@entities/Organization';
import { useRequiredOrgAccountData } from './useOrgAccountData';

export function OrgAccountSettings() {
  const { t } = useAppContext();
  const { org, isLoading, invalidateOrgQueries } = useRequiredOrgAccountData();
  const [email, setEmail] = useState(org?.email ?? '');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  const saveEmailMutation = useMutation({
    mutationFn: () => organizationsApi.updateMyEmail({ email }),
    onSuccess: async () => { await invalidateOrgQueries(); toast.success(t.orgAccount.settings.emailUpdated); },
    onError: () => toast.error(t.orgAccount.settings.emailUpdateFailed),
  });

  const savePasswordMutation = useMutation({
    mutationFn: () => organizationsApi.changeMyPassword(passwordForm),
    onSuccess: () => { setPasswordForm({ currentPassword: '', newPassword: '' }); toast.success(t.orgAccount.settings.passwordUpdated); },
    onError: () => toast.error(t.orgAccount.settings.passwordUpdateFailed),
  });

  if (isLoading || !org) return <section className="mt-5 h-40 animate-pulse rounded-xl border border-border/60 bg-muted" />;

  return (
    <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-base font-semibold">{t.orgAccount.settings.title}</h2>

      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); saveEmailMutation.mutate(); }}>
        <Field>
          <FieldLabel htmlFor="org-email">{t.common.email}</FieldLabel>
          <Input id="org-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.orgAccount.settings.emailPlaceholder} />
          <FieldDescription>{t.orgAccount.settings.emailDesc}</FieldDescription>
        </Field>
        <Button type="submit" variant="outline" disabled={saveEmailMutation.isPending}>
          {saveEmailMutation.isPending ? t.common.updating : t.orgAccount.settings.updateEmail}
        </Button>
      </form>

      <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); savePasswordMutation.mutate(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="current-password">{t.orgAccount.settings.currentPassword}</FieldLabel>
            <Input id="current-password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="new-password">{t.orgAccount.settings.newPassword}</FieldLabel>
            <Input id="new-password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
          </Field>
        </div>
        <Button type="submit" variant="outline" disabled={savePasswordMutation.isPending}>
          {savePasswordMutation.isPending ? t.common.updating : t.orgAccount.settings.changePassword}
        </Button>
      </form>
    </section>
  );
}
