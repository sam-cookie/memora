import { useQuery } from '@tanstack/react-query'
import { notificationsService } from '../services/notifications.service'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getAll(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
