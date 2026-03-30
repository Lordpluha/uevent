import { usersApi } from '@entities/User'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useNotificationMutations(invalidateUser: () => Promise<void>) {
  const notificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ notificationsEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error('Failed to update notification settings'),
  })

  const pushNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ pushNotificationsEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error('Failed to update push notification settings'),
  })

  const paymentEmailMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ paymentEmailEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error('Failed to update payment email settings'),
  })

  const subscriptionNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ subscriptionNotificationsEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error('Failed to update subscription notification settings'),
  })

  const loginNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => usersApi.updateMe({ loginNotificationsEnabled: enabled }),
    onSuccess: async () => {
      await invalidateUser()
    },
    onError: () => toast.error('Failed to update login notification settings'),
  })

  return {
    notificationsMutation,
    pushNotificationsMutation,
    paymentEmailMutation,
    subscriptionNotificationsMutation,
    loginNotificationsMutation,
  }
}
