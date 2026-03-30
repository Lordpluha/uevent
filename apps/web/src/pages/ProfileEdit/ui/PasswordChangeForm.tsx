import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { Eye, EyeOff, Save, Shield, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
  Input,
  Switch,
} from '@shared/components';

export function PasswordChangeForm() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const setPass = (field: keyof typeof passwordForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleShow = (field: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));

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

  const passwordField = (id: string, label: string, field: 'current' | 'next' | 'confirm', placeholder: string) => (
    <Field data-invalid={!!passwordErrors[field] || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={showPassword[field] ? 'text' : 'password'}
          value={passwordForm[field]}
          onChange={setPass(field)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => toggleShow(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Toggle password visibility"
        >
          {showPassword[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldError errors={passwordErrors[field] ? [{ message: passwordErrors[field] }] : []} />
    </Field>
  );

  return (
    <section id="password">
      <h2 className="mb-1 text-base font-semibold">Security</h2>
      <p className="mb-6 text-xs text-muted-foreground">Manage your password and two-factor authentication.</p>

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
          <Switch checked={twoFaEnabled} onCheckedChange={setTwoFaEnabled} aria-label="Toggle 2FA" />
        </Field>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <FieldGroup>
          {passwordField('current-password', 'Current password', 'current', 'Enter current password')}
          <FieldSeparator />
          {passwordField('new-password', 'New password', 'next', 'At least 8 characters')}
          {passwordField('confirm-password', 'Confirm new password', 'confirm', 'Repeat new password')}
        </FieldGroup>

        <div className="flex justify-end">
          <Button type="submit" variant="outline" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Update password
          </Button>
        </div>
      </form>
    </section>
  );
}
