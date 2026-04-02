import { usersApi } from '@entities/User'
import { useAppContext } from '@shared/lib'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useNotificationMutations(invalidateUser: () => Promise<void>) {
  const { t } = useAppContext()

  const notificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ notificationsEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error(t.profileSettings.notifications.updateFailed),
  })

  const pushNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ pushNotificationsEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error(t.profileSettings.notifications.updateFailed),
  })

  const paymentEmailMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ paymentEmailEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error(t.profileSettings.notifications.updateFailed),
  })

  const subscriptionNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ subscriptionNotificationsEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error(t.profileSettings.notifications.updateFailed),
  })

  const loginNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ loginNotificationsEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error(t.profileSettings.notifications.updateFailed),
  })

  const hiddenFromAttendeesMutation = useMutation({
    mutationFn: (hidden: boolean) => usersApi.updateMe({ hiddenFromAttendees: hidden }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error(t.profileSettings.notifications.updateFailed),
  })

  return {
    notificationsMutation,
    pushNotificationsMutation,
    paymentEmailMutation,
    subscriptionNotificationsMutation,
    loginNotificationsMutation,
    hiddenFromAttendeesMutation,
  }
}
