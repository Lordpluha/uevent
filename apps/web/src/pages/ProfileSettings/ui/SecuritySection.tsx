import { useState } from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Field,
  FieldDescription,
  FieldTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Switch,
} from '@shared/components';
import { authApi } from '@shared/api/auth.api';
import { PasswordChangeForm } from './PasswordChangeForm';
import type { UserProfile } from './types';

interface SecuritySectionProps {
  user: UserProfile;
  invalidateUser: () => Promise<void>;
  twoFa: boolean;
  setTwoFa: (value: boolean) => void;
}

export function SecuritySection({ user, invalidateUser, twoFa, setTwoFa }: SecuritySectionProps) {
  const [isEnableTwoFaDialogOpen, setIsEnableTwoFaDialogOpen] = useState(false);
  const [isDisableTwoFaDialogOpen, setIsDisableTwoFaDialogOpen] = useState(false);
  const [twoFaSetupData, setTwoFaSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [disableTwoFaCode, setDisableTwoFaCode] = useState('');

  const twoFaSetupMutation = useMutation({
    mutationFn: () => authApi.setup2fa(),
    onSuccess: (data) => {
      setTwoFaSetupData(data);
      setTwoFaCode('');
      setIsEnableTwoFaDialogOpen(true);
    },
    onError: () => toast.error('Failed to start 2FA setup'),
  });

  const twoFaConfirmMutation = useMutation({
    mutationFn: (code: string) => authApi.confirm2fa(code),
    onSuccess: async () => {
      await invalidateUser();
      setTwoFa(true);
      setIsEnableTwoFaDialogOpen(false);
      setTwoFaSetupData(null);
      setTwoFaCode('');
      toast.success('2FA enabled');
    },
    onError: () => { toast.error('Invalid verification code'); setTwoFaCode(''); },
  });

  const twoFaDisableMutation = useMutation({
    mutationFn: (code: string) => authApi.disable2fa(code),
    onSuccess: async () => {
      await invalidateUser();
      setTwoFa(false);
      setIsDisableTwoFaDialogOpen(false);
      setDisableTwoFaCode('');
      toast.success('2FA disabled');
    },
    onError: () => { toast.error('Invalid verification code'); setDisableTwoFaCode(''); },
  });

  const handleTwoFaChange = (enabled: boolean) => {
    if (!enabled) {
      setDisableTwoFaCode('');
      setIsDisableTwoFaDialogOpen(true);
      return;
    }
    twoFaSetupMutation.mutate();
  };

  const confirmEnableTwoFa = () => {
    if (twoFaCode.length !== 6) return;
    twoFaConfirmMutation.mutate(twoFaCode);
  };

  const confirmDisableTwoFa = () => {
    if (disableTwoFaCode.length !== 6) return;
    twoFaDisableMutation.mutate(disableTwoFaCode);
  };

  return (
    <>
      {/* Enable 2FA dialog */}
      <AlertDialog open={isEnableTwoFaDialogOpen} onOpenChange={(o) => { if (!o) { setIsEnableTwoFaDialogOpen(false); setTwoFaSetupData(null); setTwoFaCode(''); } }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Set up two-factor authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to verify.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {twoFaSetupData && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-xl border border-border bg-white p-3">
                <img src={twoFaSetupData.qrCodeDataUrl} alt="2FA QR Code" className="h-48 w-48" />
              </div>
              <div className="w-full rounded-lg bg-muted/50 p-3 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Or enter this key manually:</p>
                <code className="text-xs font-mono break-all select-all">{twoFaSetupData.secret}</code>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium">Verification code</p>
                <InputOTP maxLength={6} value={twoFaCode} onChange={setTwoFaCode}>
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
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={twoFaConfirmMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEnableTwoFa} disabled={twoFaConfirmMutation.isPending || twoFaCode.length !== 6}>
              {twoFaConfirmMutation.isPending ? 'Verifying...' : 'Enable 2FA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable 2FA dialog */}
      <AlertDialog open={isDisableTwoFaDialogOpen} onOpenChange={(o) => { if (!o) { setIsDisableTwoFaDialogOpen(false); setDisableTwoFaCode(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current 2FA code to confirm disabling two-factor authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center gap-2 py-2">
            <InputOTP maxLength={6} value={disableTwoFaCode} onChange={setDisableTwoFaCode}>
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={twoFaDisableMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableTwoFa} disabled={twoFaDisableMutation.isPending || disableTwoFaCode.length !== 6}>
              {twoFaDisableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2FA toggle */}
      <div className="mb-6 rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle className="gap-1.5">
              {twoFa ? (
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              ) : (
                <Shield className="h-4 w-4 text-muted-foreground" />
              )}
              Two-factor authentication
            </FieldTitle>
            <FieldDescription className="mt-0.5">
              {twoFa
                ? 'Enabled — your account is protected.'
                : 'Add a second layer of security to your account.'}
            </FieldDescription>
          </div>
          <Switch
            checked={twoFa}
            onCheckedChange={handleTwoFaChange}
            disabled={twoFaSetupMutation.isPending || twoFaConfirmMutation.isPending || twoFaDisableMutation.isPending}
            aria-label="Toggle 2FA"
          />
        </Field>
      </div>

      <PasswordChangeForm />
    </>
  );
}
