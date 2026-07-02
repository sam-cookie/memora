import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analytics.service'
import { useWorkspace } from '@/providers/WorkspaceProvider'
import { useAuth } from '@/hooks/useAuth'

export function useAnalytics() {
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['analytics', activeWorkspace?.id],
    queryFn: () => analyticsService.getAnalytics(activeWorkspace?.id),
    enabled: isAuthenticated && !workspaceLoading,
    staleTime: 60_000,
  })
}
