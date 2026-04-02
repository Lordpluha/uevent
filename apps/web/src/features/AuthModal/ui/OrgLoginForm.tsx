import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button, Input, Label } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useAuth } from '@shared/lib/auth-context';
import { authApi } from '@shared/api/auth.api';
import { SwitchPrompt, FieldError } from './shared';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type LoginValues = z.infer<typeof loginSchema>;

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

export const OrgLoginForm = ({
  t,
  onSwitch,
  onSuccess,
  on2faRequired,
}: { t: OrgLoginDict; onSwitch: () => void; onSuccess: () => void; on2faRequired?: (tempToken: string) => void }) => {
  const { setAuthenticated } = useAuth();
  const { t: appT } = useAppContext();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (v: LoginValues) => authApi.loginOrg(v.email, v.password),
    onSuccess: (data) => {
      if ('requires2fa' in data) {
        on2faRequired?.(data.tempToken);
        return;
      }
      setAuthenticated(data.accountType);
      toast.success(appT.authExtra.loginSuccess);
      onSuccess();
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
        <Label htmlFor="org-login-email">{t.email}</Label>
        <Input id="org-login-email" type="email" placeholder={t.emailPlaceholder} autoComplete="email" {...register('email')} />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-login-password">{t.password}</Label>
        <Input id="org-login-password" type="password" placeholder={t.passwordPlaceholder} autoComplete="current-password" {...register('password')} />
        <FieldError message={errors.password?.message} />
      </div>
      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.submit}
      </Button>
      <SwitchPrompt text={t.noAccount} action={t.switchToRegister} onAction={onSwitch} />
    </form>
  );
};
