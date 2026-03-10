import { cva } from 'class-variance-authority';
import { Building2, User } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger, Button, Input, Label } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { cn } from '@shared/lib/utils';

/* ── cva ─────────────────────────────────────────────────── */

const triggerVariants = cva(
  'inline-flex items-center font-medium transition-colors border border-border hover:bg-accent',
  {
    variants: {
      variant: {
        pill: 'rounded-full px-3 py-2 text-sm text-foreground',
        block: 'w-full justify-center rounded-md px-4 py-2 text-sm text-foreground',
      },
    },
    defaultVariants: { variant: 'pill' },
  },
);

/* ── Types ───────────────────────────────────────────────── */

type AccountType = 'user' | 'organization';
type AuthTab = 'login' | 'register';

type Props = {
  defaultTab?: AuthTab;
  variant?: 'pill' | 'block';
};

/* ── Component ───────────────────────────────────────────── */

export const AuthModal = ({ defaultTab = 'login', variant = 'pill' }: Props) => {
  const { t } = useAppContext();
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [tab, setTab] = useState<AuthTab>(defaultTab);

  return (
    <Dialog>
      <DialogTrigger render={<button type="button" className={cn(triggerVariants({ variant }))} />}>
        {t.header.actions.login}
      </DialogTrigger>

      <DialogContent className="w-full max-w-sm rounded-2xl p-8">
        {/* Account type switcher */}
        <div className="mb-5 grid grid-cols-2 gap-2">
          {(['user', 'organization'] as AccountType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                accountType === type
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {type === 'user' ? <User className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
              {type === 'user' ? t.auth.tabs.user : t.auth.tabs.organization}
            </button>
          ))}
        </div>

        {/* Login / Register sub-tabs */}
        <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-full border border-border text-sm font-medium">
          {(['login', 'register'] as AuthTab[]).map((authTab) => (
            <button
              key={authTab}
              type="button"
              onClick={() => setTab(authTab)}
              className={cn(
                'px-4 py-2 text-center transition-colors',
                tab === authTab ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {authTab === 'login'
                ? accountType === 'user'
                  ? t.auth.login.title
                  : t.auth.orgLogin.title
                : accountType === 'user'
                  ? t.auth.register.title
                  : t.auth.orgRegister.title}
            </button>
          ))}
        </div>

        {/* Forms */}
        {accountType === 'user' ? (
          tab === 'login' ? (
            <LoginForm t={t.auth.login} onSwitch={() => setTab('register')} />
          ) : (
            <RegisterForm t={t.auth.register} onSwitch={() => setTab('login')} />
          )
        ) : tab === 'login' ? (
          <OrgLoginForm t={t.auth.orgLogin} onSwitch={() => setTab('register')} />
        ) : (
          <OrgRegisterForm t={t.auth.orgRegister} onSwitch={() => setTab('login')} />
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ──────────────────────────────────────────────────────────── */
/*  Shared helpers                                               */
/* ──────────────────────────────────────────────────────────── */

const Divider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <span className="h-px flex-1 bg-border" />
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="h-px flex-1 bg-border" />
  </div>
);

const GoogleButton = ({ label }: { label: string }) => (
  <button
    type="button"
    onClick={() => {
      window.location.href = '/auth/google';
    }}
    className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
  >
    <GoogleIcon />
    {label}
  </button>
);

const SwitchPrompt = ({ text, action, onAction }: { text: string; action: string; onAction: () => void }) => (
  <p className="text-center text-sm text-muted-foreground">
    {text}{' '}
    <button type="button" onClick={onAction} className="font-medium text-foreground underline-offset-2 hover:underline">
      {action}
    </button>
  </p>
);

/* ──────────────────────────────────────────────────────────── */
/*  User — Login                                                 */
/* ──────────────────────────────────────────────────────────── */

type LoginDict = {
  subtitle: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  submit: string;
  noAccount: string;
  switchToRegister: string;
  continueWithGoogle: string;
  orDivider: string;
};

const LoginForm = ({ t, onSwitch }: { t: LoginDict; onSwitch: () => void }) => (
  <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
    <p className="mb-1 text-center text-sm text-muted-foreground">{t.subtitle}</p>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="login-email">{t.email}</Label>
      <Input id="login-email" type="email" placeholder={t.emailPlaceholder} required autoComplete="email" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="login-password">{t.password}</Label>
      <Input
        id="login-password"
        type="password"
        placeholder={t.passwordPlaceholder}
        required
        autoComplete="current-password"
      />
    </div>
    <Button type="submit" className="mt-2 w-full">
      {t.submit}
    </Button>
    <Divider label={t.orDivider} />
    <GoogleButton label={t.continueWithGoogle} />
    <SwitchPrompt text={t.noAccount} action={t.switchToRegister} onAction={onSwitch} />
  </form>
);

/* ──────────────────────────────────────────────────────────── */
/*  User — Register                                              */
/* ──────────────────────────────────────────────────────────── */

type RegisterDict = {
  subtitle: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  submit: string;
  hasAccount: string;
  switchToLogin: string;
  continueWithGoogle: string;
  orDivider: string;
};

const RegisterForm = ({ t, onSwitch }: { t: RegisterDict; onSwitch: () => void }) => (
  <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
    <p className="mb-1 text-center text-sm text-muted-foreground">{t.subtitle}</p>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="reg-name">{t.name}</Label>
      <Input id="reg-name" type="text" placeholder={t.namePlaceholder} required autoComplete="name" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="reg-email">{t.email}</Label>
      <Input id="reg-email" type="email" placeholder={t.emailPlaceholder} required autoComplete="email" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="reg-password">{t.password}</Label>
      <Input
        id="reg-password"
        type="password"
        placeholder={t.passwordPlaceholder}
        required
        autoComplete="new-password"
        minLength={8}
      />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="reg-confirm">{t.confirmPassword}</Label>
      <Input
        id="reg-confirm"
        type="password"
        placeholder={t.confirmPasswordPlaceholder}
        required
        autoComplete="new-password"
      />
    </div>
    <Button type="submit" className="mt-2 w-full">
      {t.submit}
    </Button>
    <Divider label={t.orDivider} />
    <GoogleButton label={t.continueWithGoogle} />
    <SwitchPrompt text={t.hasAccount} action={t.switchToLogin} onAction={onSwitch} />
  </form>
);

/* ──────────────────────────────────────────────────────────── */
/*  Organization — Login                                         */
/* ──────────────────────────────────────────────────────────── */

type OrgLoginDict = {
  subtitle: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  submit: string;
  noAccount: string;
  switchToRegister: string;
  orDivider: string;
};

const OrgLoginForm = ({ t, onSwitch }: { t: OrgLoginDict; onSwitch: () => void }) => (
  <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
    <p className="mb-1 text-center text-sm text-muted-foreground">{t.subtitle}</p>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="org-login-email">{t.email}</Label>
      <Input id="org-login-email" type="email" placeholder={t.emailPlaceholder} required autoComplete="email" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="org-login-password">{t.password}</Label>
      <Input
        id="org-login-password"
        type="password"
        placeholder={t.passwordPlaceholder}
        required
        autoComplete="current-password"
      />
    </div>
    <Button type="submit" className="mt-2 w-full">
      {t.submit}
    </Button>
    <SwitchPrompt text={t.noAccount} action={t.switchToRegister} onAction={onSwitch} />
  </form>
);

/* ──────────────────────────────────────────────────────────── */
/*  Organization — Register                                      */
/* ──────────────────────────────────────────────────────────── */

type OrgRegisterDict = {
  subtitle: string;
  orgName: string;
  orgNamePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  submit: string;
  hasAccount: string;
  switchToLogin: string;
  orDivider: string;
};

const OrgRegisterForm = ({ t, onSwitch }: { t: OrgRegisterDict; onSwitch: () => void }) => (
  <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
    <p className="mb-1 text-center text-sm text-muted-foreground">{t.subtitle}</p>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="org-name">{t.orgName}</Label>
      <Input id="org-name" type="text" placeholder={t.orgNamePlaceholder} required autoComplete="organization" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="org-reg-email">{t.email}</Label>
      <Input id="org-reg-email" type="email" placeholder={t.emailPlaceholder} required autoComplete="email" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="org-reg-password">{t.password}</Label>
      <Input
        id="org-reg-password"
        type="password"
        placeholder={t.passwordPlaceholder}
        required
        autoComplete="new-password"
        minLength={8}
      />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="org-reg-confirm">{t.confirmPassword}</Label>
      <Input
        id="org-reg-confirm"
        type="password"
        placeholder={t.confirmPasswordPlaceholder}
        required
        autoComplete="new-password"
      />
    </div>
    <Button type="submit" className="mt-2 w-full">
      {t.submit}
    </Button>
    <SwitchPrompt text={t.hasAccount} action={t.switchToLogin} onAction={onSwitch} />
  </form>
);

/* ──────────────────────────────────────────────────────────── */
/*  Google icon                                                  */
/* ──────────────────────────────────────────────────────────── */

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
    />
  </svg>
);
