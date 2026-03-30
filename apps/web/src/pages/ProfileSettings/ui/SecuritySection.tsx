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
import { useAppContext } from '@shared/lib';
import { PasswordChangeForm } from './PasswordChangeForm';
import type { UserProfile } from './types';

interface SecuritySectionProps {
  user: UserProfile;
  invalidateUser: () => Promise<void>;
  twoFa: boolean;
  setTwoFa: (value: boolean) => void;
}

export function SecuritySection({ user, invalidateUser, twoFa, setTwoFa }: SecuritySectionProps) {
  const { t } = useAppContext();
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
    onError: () => toast.error(t.profileSettings.security.setupFailed),
  });

  const twoFaConfirmMutation = useMutation({
    mutationFn: (code: string) => authApi.confirm2fa(code),
    onSuccess: async () => {
      await invalidateUser();
      setTwoFa(true);
      setIsEnableTwoFaDialogOpen(false);
      setTwoFaSetupData(null);
      setTwoFaCode('');
      toast.success(t.profileSettings.security.enabled);
    },
    onError: () => { toast.error(t.profileSettings.security.invalidCode); setTwoFaCode(''); },
  });

  const twoFaDisableMutation = useMutation({
    mutationFn: (code: string) => authApi.disable2fa(code),
    onSuccess: async () => {
      await invalidateUser();
      setTwoFa(false);
      setIsDisableTwoFaDialogOpen(false);
      setDisableTwoFaCode('');
      toast.success(t.profileSettings.security.disabled);
    },
    onError: () => { toast.error(t.profileSettings.security.invalidCode); setDisableTwoFaCode(''); },
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
            <AlertDialogTitle>{t.profileSettings.security.setupTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.profileSettings.security.setupDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {twoFaSetupData && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-xl border border-border bg-white p-3">
                <img src={twoFaSetupData.qrCodeDataUrl} alt={t.profileSettings.security.qrAlt} className="h-48 w-48" />
              </div>
              <div className="w-full rounded-lg bg-muted/50 p-3 text-center">
                <p className="mb-1 text-xs text-muted-foreground">{t.profileSettings.security.manualKey}</p>
                <code className="text-xs font-mono break-all select-all">{twoFaSetupData.secret}</code>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium">{t.profileSettings.security.verificationCode}</p>
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
            <AlertDialogCancel disabled={twoFaConfirmMutation.isPending}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEnableTwoFa} disabled={twoFaConfirmMutation.isPending || twoFaCode.length !== 6}>
              {twoFaConfirmMutation.isPending ? t.common.verifying : t.profileSettings.security.enable2fa}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable 2FA dialog */}
      <AlertDialog open={isDisableTwoFaDialogOpen} onOpenChange={(o) => { if (!o) { setIsDisableTwoFaDialogOpen(false); setDisableTwoFaCode(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.profileSettings.security.disableTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.profileSettings.security.disableDesc}
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
            <AlertDialogCancel disabled={twoFaDisableMutation.isPending}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableTwoFa} disabled={twoFaDisableMutation.isPending || disableTwoFaCode.length !== 6}>
              {twoFaDisableMutation.isPending ? t.profileSettings.security.disabling : t.profileSettings.security.disable2fa}
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
              {t.profileSettings.security.twoFa}
            </FieldTitle>
            <FieldDescription className="mt-0.5">
              {twoFa
                ? t.profileSettings.security.enabledDesc
                : t.profileSettings.security.disabledDesc}
            </FieldDescription>
          </div>
          <Switch
            checked={twoFa}
            onCheckedChange={handleTwoFaChange}
            disabled={twoFaSetupMutation.isPending || twoFaConfirmMutation.isPending || twoFaDisableMutation.isPending}
            aria-label={t.profileSettings.security.toggleTwoFa}
          />
        </Field>
      </div>

      <PasswordChangeForm />
    </>
  );
}
