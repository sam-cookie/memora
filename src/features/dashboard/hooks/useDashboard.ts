import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard.service'
import { useWorkspace } from '@/providers/WorkspaceProvider'
import { useAuth } from '@/hooks/useAuth'

function useReadyToQuery() {
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const { isAuthenticated } = useAuth()
  return { activeWorkspace, enabled: isAuthenticated && !workspaceLoading }
}

export function useRecentDecisions() {
  const { activeWorkspace, enabled } = useReadyToQuery()

  return useQuery({
    queryKey: ['dashboard', 'recent-decisions', activeWorkspace?.id],
    queryFn: () => dashboardService.getRecentDecisions(activeWorkspace?.id),
    enabled,
  })
}

export function useDashboardStats() {
  const { activeWorkspace, enabled } = useReadyToQuery()

  return useQuery({
    queryKey: ['dashboard', 'stats', activeWorkspace?.id],
    queryFn: () => dashboardService.getStats(activeWorkspace?.id),
    enabled,
    refetchInterval: (query) =>
      (query.state.data?.processingMeetings ?? 0) > 0 ? 5_000 : false,
  })
}

export function useRecentMeetings() {
  const { activeWorkspace, enabled } = useReadyToQuery()

  return useQuery({
    queryKey: ['dashboard', 'recent-meetings', activeWorkspace?.id],
    queryFn: () => dashboardService.getRecentMeetings(activeWorkspace?.id),
    enabled,
    refetchInterval: 15_000,
  })
}

export function useAllActionItems() {
  const { activeWorkspace, enabled } = useReadyToQuery()

  return useQuery({
    queryKey: ['dashboard', 'all-action-items', activeWorkspace?.id],
    queryFn: () => dashboardService.getActionItemsWithMeetings(activeWorkspace?.id),
    enabled,
  })
}

export function useOpenActionItems() {
  const { activeWorkspace, enabled } = useReadyToQuery()

  return useQuery({
    queryKey: ['dashboard', 'open-action-items', activeWorkspace?.id],
    queryFn: () => dashboardService.getOpenActionItemsWithMeetings(activeWorkspace?.id),
    enabled,
  })
}
