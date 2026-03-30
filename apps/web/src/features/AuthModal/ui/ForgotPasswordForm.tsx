import { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Input, Label } from '@shared/components';
import { authApi } from '@shared/api/auth.api';

export const ForgotPasswordForm = ({
  onCodeSent,
  onBack,
}: { onCodeSent: (email: string) => void; onBack: () => void }) => {
  const [email, setEmail] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('Reset code sent to your email');
      onCodeSent(email);
    },
    onError: () => toast.error('Failed to send reset code'),
  });

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to login
      </button>
      <div className="text-center">
        <h3 className="text-lg font-semibold">Forgot password?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send you a reset code.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <Button onClick={() => mutate()} className="w-full" disabled={isPending || !email}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset code'}
      </Button>
    </div>
  );
};
