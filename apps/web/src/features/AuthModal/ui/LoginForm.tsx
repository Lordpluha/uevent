import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button, Input, Label } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useAuth } from '@shared/lib/auth-context';
import { authApi } from '@shared/api/auth.api';
import type { LoginResult } from '@shared/api/auth.api';
import { usersApi } from '@entities/User';
import { Divider, FieldError, GoogleButton, SwitchPrompt } from './shared';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type LoginValues = z.infer<typeof loginSchema>;

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

export const LoginForm = ({
  t,
  onSwitch,
  onSuccess,
  on2faRequired,
  onForgotPassword,
}: { t: LoginDict; onSwitch: () => void; onSuccess: () => void; on2faRequired: (token: string) => void; onForgotPassword: () => void }) => {
  const { setAuthenticated } = useAuth();
  const { t: appT } = useAppContext();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (v: LoginValues) => authApi.loginUser(v.email, v.password),
    onSuccess: (data: LoginResult) => {
      if ('requires2fa' in data && data.requires2fa) {
        on2faRequired(data.tempToken);
        return;
      }
      if ('accountType' in data) {
        setAuthenticated(data.accountType);
        queryClient.prefetchQuery({ queryKey: ['me'], queryFn: () => usersApi.getMe() });
        toast.success(appT.authExtra.loginSuccess);
        onSuccess();
      }
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('banned')) {
        toast.error(appT.authExtra.accountBanned);
      } else {
        toast.error(appT.authExtra.invalidCredentials);
      }
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => mutate(v))} className="flex flex-col gap-4">
      <p className="mb-1 text-center text-sm text-muted-foreground">{t.subtitle}</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">{t.email}</Label>
        <Input id="login-email" type="email" placeholder={t.emailPlaceholder} autoComplete="email" {...register('email')} />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">{t.password}</Label>
        <Input id="login-password" type="password" placeholder={t.passwordPlaceholder} autoComplete="current-password" {...register('password')} />
        <FieldError message={errors.password?.message} />
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={onForgotPassword} className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
          {appT.authExtra.forgotPassword}
        </button>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.submit}
      </Button>
      <Divider label={t.orDivider} />
      <GoogleButton label={t.continueWithGoogle} />
      <SwitchPrompt text={t.noAccount} action={t.switchToRegister} onAction={onSwitch} />
    </form>
  );
};
