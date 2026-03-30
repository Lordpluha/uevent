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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Switch,
} from '@shared/components';
import { authApi } from '@shared/api/auth.api';
import { useAppContext } from '@shared/lib';
import type { OrgModel } from './types';

interface Props {
  org: OrgModel;
  invalidate: () => Promise<void>;
}

export function OrgSecuritySection({ org, invalidate }: Props) {
  const { t } = useAppContext();
  const [isEnableTwoFaDialogOpen, setIsEnableTwoFaDialogOpen] = useState(false);
  const [isDisableTwoFaDialogOpen, setIsDisableTwoFaDialogOpen] = useState(false);
  const [twoFaSetupData, setTwoFaSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [disableTwoFaCode, setDisableTwoFaCode] = useState('');

  const twoFaSetupMutation = useMutation({
    mutationFn: () => authApi.setupOrg2fa(),
    onSuccess: (data) => {
      setTwoFaSetupData(data);
      setTwoFaCode('');
      setIsEnableTwoFaDialogOpen(true);
    },
    onError: () => toast.error(t.orgAccount.security.setupFailed),
  });

  const twoFaConfirmMutation = useMutation({
    mutationFn: (code: string) => authApi.confirmOrg2fa(code),
    onSuccess: async () => {
      await invalidate();
      setIsEnableTwoFaDialogOpen(false);
      setTwoFaSetupData(null);
      setTwoFaCode('');
      toast.success(t.orgAccount.security.enabled);
    },
    onError: () => { toast.error(t.orgAccount.security.invalidCode); setTwoFaCode(''); },
  });

  const twoFaDisableMutation = useMutation({
    mutationFn: (code: string) => authApi.disableOrg2fa(code),
    onSuccess: async () => {
      await invalidate();
      setIsDisableTwoFaDialogOpen(false);
      setDisableTwoFaCode('');
      toast.success(t.orgAccount.security.disabled);
    },
    onError: () => { toast.error(t.orgAccount.security.invalidCode); setDisableTwoFaCode(''); },
  });

  const handleTwoFaChange = (enabled: boolean) => {
    if (!enabled) {
      setDisableTwoFaCode('');
      setIsDisableTwoFaDialogOpen(true);
      return;
    }
    twoFaSetupMutation.mutate();
  };

  const twoFaEnabled = org.twoFactorEnabled ?? false;

  return (
    <>
      {/* Enable 2FA dialog */}
      <AlertDialog
        open={isEnableTwoFaDialogOpen}
        onOpenChange={(o) => { if (!o) { setIsEnableTwoFaDialogOpen(false); setTwoFaSetupData(null); setTwoFaCode(''); } }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.orgAccount.security.setupTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.orgAccount.security.setupDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {twoFaSetupData && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-xl border border-border bg-white p-3">
                <img src={twoFaSetupData.qrCodeDataUrl} alt={t.orgAccount.security.qrAlt} className="h-48 w-48" />
              </div>
              <div className="w-full rounded-lg bg-muted/50 p-3 text-center">
                <p className="mb-1 text-xs text-muted-foreground">{t.orgAccount.security.manualKey}</p>
                <code className="break-all font-mono text-xs select-all">{twoFaSetupData.secret}</code>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium">{t.orgAccount.security.verificationCode}</p>
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
            <AlertDialogAction
              onClick={() => twoFaConfirmMutation.mutate(twoFaCode)}
              disabled={twoFaConfirmMutation.isPending || twoFaCode.length !== 6}
            >
              {twoFaConfirmMutation.isPending ? t.orgAccount.security.enabling : t.orgAccount.security.enable2fa}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable 2FA dialog */}
      <AlertDialog
        open={isDisableTwoFaDialogOpen}
        onOpenChange={(o) => { if (!o) { setIsDisableTwoFaDialogOpen(false); setDisableTwoFaCode(''); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.orgAccount.security.disableTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.orgAccount.security.disableDesc}
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
            <AlertDialogAction
              onClick={() => twoFaDisableMutation.mutate(disableTwoFaCode)}
              disabled={twoFaDisableMutation.isPending || disableTwoFaCode.length !== 6}
            >
              {twoFaDisableMutation.isPending ? t.orgAccount.security.disabling : t.orgAccount.security.disable2fa}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-base font-semibold">{t.orgAccount.security.title}</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
          <div className="flex items-start gap-2">
            {twoFaEnabled ? (
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">{t.orgAccount.security.twoFa}</p>
              <p className="text-xs text-muted-foreground">
                {twoFaEnabled ? t.orgAccount.security.enabledDesc : t.orgAccount.security.twoFaDesc}
              </p>
            </div>
          </div>
          <Switch
            checked={twoFaEnabled}
            onCheckedChange={handleTwoFaChange}
            disabled={twoFaSetupMutation.isPending || twoFaConfirmMutation.isPending || twoFaDisableMutation.isPending}
            aria-label={t.orgAccount.security.toggleTwoFa}
          />
        </div>
      </section>
    </>
  );
}

