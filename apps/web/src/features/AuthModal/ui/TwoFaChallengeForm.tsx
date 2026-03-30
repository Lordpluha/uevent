import { useState } from 'react';
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, InputOTP, InputOTPGroup, InputOTPSlot } from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useAuth } from '@shared/lib/auth-context';
import { authApi } from '@shared/api/auth.api';
import { usersApi } from '@entities/User';

export const TwoFaChallengeForm = ({
  tempToken,
  onSuccess,
  onBack,
  accountType = 'user',
}: { tempToken: string; onSuccess: () => void; onBack: () => void; accountType?: 'user' | 'organization' }) => {
  const { setAuthenticated } = useAuth();
  const { t } = useAppContext();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      accountType === 'organization'
        ? authApi.verifyOrg2fa(tempToken, code)
        : authApi.verify2fa(tempToken, code),
    onSuccess: (data) => {
      setAuthenticated(data.accountType);
      queryClient.prefetchQuery({ queryKey: ['me'], queryFn: () => usersApi.getMe() });
      toast.success(t.authExtra.loginSuccess);
      onSuccess();
    },
    onError: () => { toast.error(t.authExtra.invalid2fa); setCode(''); },
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <KeyRound className="h-6 w-6 text-primary" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t.authExtra.twoFaTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t.authExtra.twoFaDesc}</p>
      </div>
      <InputOTP maxLength={6} value={code} onChange={setCode} onComplete={() => mutate()}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <Button onClick={() => mutate()} className="w-full" disabled={isPending || code.length !== 6}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.authExtra.verify}
      </Button>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {t.authExtra.backToLogin}
      </button>
    </div>
  );
};
