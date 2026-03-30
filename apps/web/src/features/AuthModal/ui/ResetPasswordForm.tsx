import { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Input, Label, InputOTP, InputOTPGroup, InputOTPSlot } from '@shared/components';
import { authApi } from '@shared/api/auth.api';

export const ResetPasswordForm = ({
  email,
  onSuccess,
  onBack,
}: { email: string; onSuccess: () => void; onBack: () => void }) => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.resetPassword(email, code, password),
    onSuccess: () => {
      toast.success('Password reset successfully. Please log in.');
      onSuccess();
    },
    onError: () => toast.error('Invalid or expired reset code'),
  });

  const canSubmit = code.length === 6 && password.length >= 8 && password === confirmPassword;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <div className="text-center">
        <h3 className="text-lg font-semibold">Reset password</h3>
        <p className="mt-1 text-sm text-muted-foreground">Enter the code sent to <strong>{email}</strong></p>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Label>Verification code</Label>
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-password">New password</Label>
        <Input
          id="reset-password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-confirm">Confirm password</Label>
        <Input
          id="reset-confirm"
          type="password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
      </div>
      <Button onClick={() => mutate()} className="w-full" disabled={isPending || !canSubmit}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset password'}
      </Button>
    </div>
  );
};
