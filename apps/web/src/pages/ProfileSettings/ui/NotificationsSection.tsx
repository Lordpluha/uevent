import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Field,
  FieldDescription,
  FieldTitle,
  Switch,
} from '@shared/components';
import { useAppContext } from '@shared/lib';
import { useNotificationMutations } from './useNotificationMutations';
import type { UserProfile } from './types';

interface NotificationsSectionProps {
  user: UserProfile;
  invalidateUser: () => Promise<void>;
}

export function NotificationsSection({ user, invalidateUser }: NotificationsSectionProps) {
  const { t } = useAppContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(user.notificationsEnabled ?? true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(user.pushNotificationsEnabled ?? false);
  const [paymentEmailEnabled, setPaymentEmailEnabled] = useState(user.paymentEmailEnabled ?? true);
  const [subscriptionNotificationsEnabled, setSubscriptionNotificationsEnabled] = useState(user.subscriptionNotificationsEnabled ?? true);
  const [loginNotificationsEnabled, setLoginNotificationsEnabled] = useState(user.loginNotificationsEnabled ?? true);
  const [browserPushPermission, setBrowserPushPermission] = useState<NotificationPermission | 'unsupported'>('default');

  const {
    notificationsMutation,
    pushNotificationsMutation,
    paymentEmailMutation,
    subscriptionNotificationsMutation,
    loginNotificationsMutation,
  } = useNotificationMutations(invalidateUser);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setBrowserPushPermission('unsupported');
      return;
    }
    setBrowserPushPermission(Notification.permission);
  }, []);

  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    notificationsMutation.mutate(enabled);
  };

  const handlePaymentEmailChange = (enabled: boolean) => {
    setPaymentEmailEnabled(enabled);
    paymentEmailMutation.mutate(enabled);
  };

  const handleSubscriptionNotificationsChange = (enabled: boolean) => {
    setSubscriptionNotificationsEnabled(enabled);
    subscriptionNotificationsMutation.mutate(enabled);
  };

  const handleLoginNotificationsChange = (enabled: boolean) => {
    setLoginNotificationsEnabled(enabled);
    loginNotificationsMutation.mutate(enabled);
  };

  const handlePushNotificationsChange = async (enabled: boolean) => {
    if (!enabled) {
      setPushNotificationsEnabled(false);
      pushNotificationsMutation.mutate(false);
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserPushPermission('unsupported');
      toast.error(t.profileSettings.notifications.pushUnsupported);
      return;
    }

    let permission: NotificationPermission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    setBrowserPushPermission(permission);

    if (permission !== 'granted') {
      setPushNotificationsEnabled(false);
      pushNotificationsMutation.mutate(false);
      toast.error(t.profileSettings.notifications.pushDenied);
      return;
    }

    setPushNotificationsEnabled(true);
    pushNotificationsMutation.mutate(true);
    toast.success(t.profileSettings.notifications.pushEnabled);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>{t.profileSettings.notifications.email}</FieldTitle>
            <FieldDescription className="mt-0.5">
              {t.profileSettings.notifications.emailDesc}
            </FieldDescription>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={handleNotificationsChange}
            disabled={notificationsMutation.isPending}
            aria-label={t.profileSettings.notifications.toggleEmail}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>{t.profileSettings.notifications.push}</FieldTitle>
            <FieldDescription className="mt-0.5">
              {t.profileSettings.notifications.permissionStatus} {browserPushPermission === 'unsupported' ? t.profileSettings.notifications.permissionUnsupported : browserPushPermission}
            </FieldDescription>
          </div>
          <Switch
            checked={pushNotificationsEnabled}
            onCheckedChange={handlePushNotificationsChange}
            disabled={pushNotificationsMutation.isPending || browserPushPermission === 'unsupported'}
            aria-label={t.profileSettings.notifications.togglePush}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>{t.profileSettings.notifications.paymentEmail}</FieldTitle>
            <FieldDescription className="mt-0.5">
              {t.profileSettings.notifications.paymentEmailDesc}
            </FieldDescription>
          </div>
          <Switch
            checked={paymentEmailEnabled}
            onCheckedChange={handlePaymentEmailChange}
            disabled={paymentEmailMutation.isPending}
            aria-label={t.profileSettings.notifications.togglePaymentEmail}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>{t.profileSettings.notifications.subscription}</FieldTitle>
            <FieldDescription className="mt-0.5">
              {t.profileSettings.notifications.subscriptionDesc}
            </FieldDescription>
          </div>
          <Switch
            checked={subscriptionNotificationsEnabled}
            onCheckedChange={handleSubscriptionNotificationsChange}
            disabled={subscriptionNotificationsMutation.isPending}
            aria-label={t.profileSettings.notifications.toggleSubscription}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>{t.profileSettings.notifications.login}</FieldTitle>
            <FieldDescription className="mt-0.5">
              {t.profileSettings.notifications.loginDesc}
            </FieldDescription>
          </div>
          <Switch
            checked={loginNotificationsEnabled}
            onCheckedChange={handleLoginNotificationsChange}
            disabled={loginNotificationsMutation.isPending}
            aria-label={t.profileSettings.notifications.toggleLogin}
          />
        </Field>
      </div>
    </div>
  );
}
