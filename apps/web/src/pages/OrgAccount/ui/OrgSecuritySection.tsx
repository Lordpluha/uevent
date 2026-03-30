import { useEffect, useState } from 'react';
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
  Button,
  Switch,
} from '@shared/components';
import { organizationsApi } from '@entities/Organization';
import type { OrgModel } from './types';

interface Props {
  org: OrgModel;
  invalidate: () => Promise<void>;
}

export function OrgSecuritySection({ org, invalidate }: Props) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [savedTwoFactorEnabled, setSavedTwoFactorEnabled] = useState(false);
  const [isEnableTwoFaDialogOpen, setIsEnableTwoFaDialogOpen] = useState(false);

  useEffect(() => {
    if (!org) return;
    const initial = org.twoFactorEnabled ?? false;
    setTwoFactorEnabled(initial);
    setSavedTwoFactorEnabled(initial);
  }, [org]);

  const saveSecurityMutation = useMutation({
    mutationFn: (enabled: boolean) => organizationsApi.updateMySecurity({ twoFactorEnabled: enabled }),
    onSuccess: async (_, enabled) => {
      await invalidate();
      setSavedTwoFactorEnabled(enabled);
      setIsEnableTwoFaDialogOpen(false);
      toast.success('Security settings updated');
    },
    onError: () => toast.error('Failed to update security settings'),
  });

  const submitSecuritySettings = () => saveSecurityMutation.mutate(twoFactorEnabled);

  const handleSecuritySaveClick = () => {
    if (!savedTwoFactorEnabled && twoFactorEnabled) {
      setIsEnableTwoFaDialogOpen(true);
      return;
    }
    submitSecuritySettings();
  };

  return (
    <>
      <AlertDialog open={isEnableTwoFaDialogOpen} onOpenChange={setIsEnableTwoFaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm to enable 2FA for your organization account and add an extra sign-in protection layer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saveSecurityMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitSecuritySettings} disabled={saveSecurityMutation.isPending}>
              {saveSecurityMutation.isPending ? 'Enabling...' : 'Enable 2FA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-base font-semibold">Security</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra login protection layer for organizers.</p>
          </div>
          <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
        </div>
        <Button className="mt-4" variant="outline" onClick={handleSecuritySaveClick} disabled={saveSecurityMutation.isPending}>
          {saveSecurityMutation.isPending ? 'Saving...' : 'Save security settings'}
        </Button>
      </section>
    </>
  );
}
