import { cva } from 'class-variance-authority';
import { Building2, User } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { cn } from '@shared/lib/utils';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { OrgLoginForm } from './OrgLoginForm';
import { OrgRegisterForm } from './OrgRegisterForm';
import { TwoFaChallengeForm } from './TwoFaChallengeForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';

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

type AccountType = 'user' | 'organization';
type AuthTab = 'login' | 'register';
type AuthView = 'main' | '2fa' | 'forgot-password' | 'reset-password';

type Props = {
  defaultTab?: AuthTab;
  variant?: 'pill' | 'block';
  triggerLabel?: string;
  triggerClassName?: string;
};

export const AuthModal = ({ defaultTab = 'login', variant = 'pill', triggerLabel, triggerClassName }: Props) => {
  const { t } = useAppContext();
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [tab, setTab] = useState<AuthTab>(defaultTab);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>('main');
  const [tempToken, setTempToken] = useState('');
  const [twoFaAccountType, setTwoFaAccountType] = useState<AccountType>('user');
  const [resetEmail, setResetEmail] = useState('');

  const handleClose = () => {
    setOpen(false);
    setView('main');
    setTempToken('');
    setResetEmail('');
  };

  const handle2faRequired = (token: string, type: AccountType = 'user') => {
    setTempToken(token);
    setTwoFaAccountType(type);
    setView('2fa');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
      <DialogTrigger render={<button type="button" className={cn(triggerVariants({ variant }), triggerClassName)} />}>
        {triggerLabel ?? t.header.actions.login}
      </DialogTrigger>

      <DialogContent className="w-full max-w-sm rounded-2xl p-8">
        {view === '2fa' ? (
          <TwoFaChallengeForm
            tempToken={tempToken}
            accountType={twoFaAccountType}
            onSuccess={handleClose}
            onBack={() => { setView('main'); setTempToken(''); }}
          />
        ) : view === 'forgot-password' ? (
          <ForgotPasswordForm
            onCodeSent={(email) => { setResetEmail(email); setView('reset-password'); }}
            onBack={() => setView('main')}
          />
        ) : view === 'reset-password' ? (
          <ResetPasswordForm
            email={resetEmail}
            onSuccess={() => { setView('main'); setTab('login'); }}
            onBack={() => setView('forgot-password')}
          />
        ) : (
          <>
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
                <LoginForm
                  t={t.auth.login}
                  onSwitch={() => setTab('register')}
                  onSuccess={handleClose}
                  on2faRequired={handle2faRequired}
                  onForgotPassword={() => setView('forgot-password')}
                />
              ) : (
                <RegisterForm t={t.auth.register} onSwitch={() => setTab('login')} onSuccess={handleClose} />
              )
            ) : tab === 'login' ? (
              <OrgLoginForm
                t={t.auth.orgLogin}
                onSwitch={() => setTab('register')}
                onSuccess={handleClose}
                on2faRequired={(token) => handle2faRequired(token, 'organization')}
              />
            ) : (
              <OrgRegisterForm t={t.auth.orgRegister} onSwitch={() => setTab('login')} onSuccess={handleClose} />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
