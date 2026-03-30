import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button, Input, Label } from '@shared/components';
import { useAuth } from '@shared/lib/auth-context';
import { authApi } from '@shared/api/auth.api';
import { organizationsApi } from '@entities/Organization';
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
}: { t: OrgLoginDict; onSwitch: () => void; onSuccess: () => void }) => {
  const { setAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (v: LoginValues) => authApi.loginOrg(v.email, v.password),
    onSuccess: (data) => {
      setAuthenticated(data.accountType);
      queryClient.prefetchQuery({ queryKey: ['me'], queryFn: () => organizationsApi.getMe() });
      toast.success('Logged in successfully');
      onSuccess();
    },
    onError: () => toast.error('Invalid email or password'),
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
