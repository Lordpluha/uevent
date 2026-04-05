import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notification.api'
import { mapApiNotification } from '../model/notificationEntity'

export function useMyNotifications(enabled: boolean, limit = 20) {
  return useQuery({
    queryKey: ['notifications', 'me', limit],
    queryFn: () => notificationsApi.getMine(limit),
    enabled,
    refetchInterval: 30000,
    select: (data) => data.map(mapApiNotification),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] })
    },
  })
}
