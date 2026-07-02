import { useQuery } from '@tanstack/react-query'
import { searchService } from '../services/search.service'
import { useWorkspace } from '@/providers/WorkspaceProvider'

export function useSearch(query: string) {
  const { activeWorkspace } = useWorkspace()

  return useQuery({
    queryKey: ['search', query, activeWorkspace?.id],
    queryFn: () => searchService.search(query, activeWorkspace?.id),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  })
}
