import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Field,
  FieldDescription,
  FieldTitle,
  Switch,
} from '@shared/components';
import { useNotificationMutations } from './useNotificationMutations';
import type { UserProfile } from './types';

interface NotificationsSectionProps {
  user: UserProfile;
  invalidateUser: () => Promise<void>;
}

export function NotificationsSection({ user, invalidateUser }: NotificationsSectionProps) {
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
      toast.error('Push notifications are not supported in this browser');
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
      toast.error('Push notifications permission was not granted');
      return;
    }

    setPushNotificationsEnabled(true);
    pushNotificationsMutation.mutate(true);
    toast.success('Push notifications enabled');
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>Email notifications</FieldTitle>
            <FieldDescription className="mt-0.5">
              Receive updates about events, tickets, and account activity.
            </FieldDescription>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={handleNotificationsChange}
            disabled={notificationsMutation.isPending}
            aria-label="Toggle email notifications"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>Browser push notifications</FieldTitle>
            <FieldDescription className="mt-0.5">
              Permission status: {browserPushPermission === 'unsupported' ? 'unsupported' : browserPushPermission}
            </FieldDescription>
          </div>
          <Switch
            checked={pushNotificationsEnabled}
            onCheckedChange={handlePushNotificationsChange}
            disabled={pushNotificationsMutation.isPending || browserPushPermission === 'unsupported'}
            aria-label="Toggle browser push notifications"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>Payment confirmation emails</FieldTitle>
            <FieldDescription className="mt-0.5">
              Receive email confirmations after successful payments.
            </FieldDescription>
          </div>
          <Switch
            checked={paymentEmailEnabled}
            onCheckedChange={handlePaymentEmailChange}
            disabled={paymentEmailMutation.isPending}
            aria-label="Toggle payment confirmation emails"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>Subscription notifications</FieldTitle>
            <FieldDescription className="mt-0.5">
              Get notified about updates from organizations you follow.
            </FieldDescription>
          </div>
          <Switch
            checked={subscriptionNotificationsEnabled}
            onCheckedChange={handleSubscriptionNotificationsChange}
            disabled={subscriptionNotificationsMutation.isPending}
            aria-label="Toggle subscription notifications"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <Field orientation="horizontal" className="items-center justify-between">
          <div>
            <FieldTitle>Login notifications</FieldTitle>
            <FieldDescription className="mt-0.5">
              Get an email when a new login is detected on your account.
            </FieldDescription>
          </div>
          <Switch
            checked={loginNotificationsEnabled}
            onCheckedChange={handleLoginNotificationsChange}
            disabled={loginNotificationsMutation.isPending}
            aria-label="Toggle login notifications"
          />
        </Field>
      </div>
    </div>
  );
}
