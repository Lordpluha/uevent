import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  Button,
  Input,
  Label,
} from '@shared/components';
import { useAppContext } from '@shared/lib';

type Tab = 'login' | 'register';

type Props = {
  /** Which tab to show initially */
  defaultTab?: Tab;
  /** 'pill'  – rounded-full trigger button (desktop header)
   *  'block' – full-width rounded-md trigger button (mobile menu) */
  variant?: 'pill' | 'block';
};

export const AuthModal = ({ defaultTab = 'login', variant = 'pill' }: Props) => {
  const { t } = useAppContext();
  const [tab, setTab] = useState<Tab>(defaultTab);

  const triggerClassName =
    variant === 'block'
      ? 'inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent'
      : 'inline-flex items-center rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent';

  return (
    <Dialog>
      <DialogTrigger render={<button type="button" className={triggerClassName} />}>
        {t.header.actions.login}
      </DialogTrigger>

      <DialogContent className="w-full max-w-sm rounded-2xl p-8">
        {/* Tab switcher */}
        <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-full border border-border text-sm font-medium">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`px-4 py-2 text-center transition-colors ${
              tab === 'login'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.auth.login.title}
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`px-4 py-2 text-center transition-colors ${
              tab === 'register'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.auth.register.title}
          </button>
        </div>

        {tab === 'login' ? (
          <LoginForm t={t.auth.login} onSwitch={() => setTab('register')} />
        ) : (
          <RegisterForm t={t.auth.register} onSwitch={() => setTab('login')} />
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ──────────────────────────────────────────────────────────── */
/*  Login form                                                   */
/* ──────────────────────────────────────────────────────────── */

type LoginDict = {
  title: string;
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

const LoginForm = ({
  t,
  onSwitch,
}: { t: LoginDict; onSwitch: () => void }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up real auth
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="mb-1 text-center">
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">{t.email}</Label>
        <Input
          id="login-email"
          type="email"
          placeholder={t.emailPlaceholder}
          required
          autoComplete="email"
        />
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

      {/* Google OAuth */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t.orDivider}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={() => { window.location.href = '/auth/google'; }}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <GoogleIcon />
        {t.continueWithGoogle}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t.noAccount}{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {t.switchToRegister}
        </button>
      </p>
    </form>
  );
};

/* ──────────────────────────────────────────────────────────── */
/*  Register form                                               */
/* ──────────────────────────────────────────────────────────── */

type RegisterDict = {
  title: string;
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

const RegisterForm = ({
  t,
  onSwitch,
}: { t: RegisterDict; onSwitch: () => void }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up real auth
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="mb-1 text-center">
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-name">{t.name}</Label>
        <Input
          id="reg-name"
          type="text"
          placeholder={t.namePlaceholder}
          required
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-email">{t.email}</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder={t.emailPlaceholder}
          required
          autoComplete="email"
        />
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

      {/* Google OAuth */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t.orDivider}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={() => { window.location.href = '/auth/google'; }}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <GoogleIcon />
        {t.continueWithGoogle}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t.hasAccount}{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {t.switchToLogin}
        </button>
      </p>
    </form>
  );
};

/* ──────────────────────────────────────────────────────────── */
/*  Google icon (official color SVG, no external dependency)    */
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
