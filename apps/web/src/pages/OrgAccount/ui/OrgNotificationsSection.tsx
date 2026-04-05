import { organizationsApi } from '@entities/Organization'
import { Switch } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRequiredOrgAccountData } from './useOrgAccountData'

export function OrgNotificationsSection() {
  const { t } = useAppContext()
  const { org, isLoading, invalidateOrgQueries } = useRequiredOrgAccountData()

  const [notificationsEnabled, setNotificationsEnabled] = useState(org?.notificationsEnabled ?? true)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(org?.pushNotificationsEnabled ?? false)

  const updateMutation = useMutation({
    mutationFn: (dto: { notificationsEnabled?: boolean; pushNotificationsEnabled?: boolean }) =>
      organizationsApi.updateMyNotifications(dto),
    onSuccess: async () => {
      await invalidateOrgQueries()
      toast.success(t.orgAccount.notifications.updated)
    },
    onError: () => toast.error(t.orgAccount.notifications.updateFailed),
  })

  const handleEmailToggle = (value: boolean) => {
    setNotificationsEnabled(value)
    updateMutation.mutate({ notificationsEnabled: value })
  }

  const handlePushToggle = (value: boolean) => {
    setPushNotificationsEnabled(value)
    updateMutation.mutate({ pushNotificationsEnabled: value })
  }

  if (isLoading || !org) {
    return <section className="mt-5 h-32 animate-pulse rounded-xl border border-border/60 bg-muted" />
  }

  return (
    <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-base font-semibold">{t.orgAccount.notifications.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.orgAccount.notifications.subtitle}</p>

      <div className="mt-5 space-y-4">
        {/* Email notifications */}
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-background/70 p-4">
          <div className="flex-1">
            <p className="text-sm font-medium">{t.orgAccount.notifications.emailNotifications}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.orgAccount.notifications.emailNotificationsDesc}</p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={handleEmailToggle}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Push notifications */}
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-background/70 p-4">
          <div className="flex-1">
            <p className="text-sm font-medium">{t.orgAccount.notifications.pushNotifications}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.orgAccount.notifications.pushNotificationsDesc}</p>
          </div>
          <Switch
            checked={pushNotificationsEnabled}
            onCheckedChange={handlePushToggle}
            disabled={updateMutation.isPending}
          />
        </div>
      </div>
    </section>
  )
}
