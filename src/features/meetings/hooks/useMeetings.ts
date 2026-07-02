import { useQuery } from '@tanstack/react-query'
import { meetingsService } from '../services/meetings.service'
import { useWorkspace } from '@/providers/WorkspaceProvider'
import { useAuth } from '@/hooks/useAuth'

export function useMeetings() {
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['meetings', activeWorkspace?.id],
    queryFn: () => meetingsService.getMeetings(activeWorkspace?.id),
    enabled: isAuthenticated && !workspaceLoading,
  })
}
