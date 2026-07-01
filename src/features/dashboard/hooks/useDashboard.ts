import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard.service'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.getStats(),
    // Poll every 5s when meetings are processing so stats update live
    refetchInterval: (query) =>
      (query.state.data?.processingMeetings ?? 0) > 0 ? 5_000 : false,
  })
}

export function useRecentMeetings() {
  return useQuery({
    queryKey: ['dashboard', 'recent-meetings'],
    queryFn: () => dashboardService.getRecentMeetings(),
    refetchInterval: 15_000,
  })
}

export function useAllActionItems() {
  return useQuery({
    queryKey: ['dashboard', 'all-action-items'],
    queryFn: () => dashboardService.getActionItemsWithMeetings(),
  })
}

export function useOpenActionItems() {
  return useQuery({
    queryKey: ['dashboard', 'open-action-items'],
    queryFn: () => dashboardService.getOpenActionItemsWithMeetings(),
  })
}
