import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actionItemsService } from '../services/actionItems.service'
import { useWorkspace } from '@/providers/WorkspaceProvider'
import { useAuth } from '@/hooks/useAuth'

export function useAllActionItems() {
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['action-items', activeWorkspace?.id],
    queryFn: () => actionItemsService.getAll(activeWorkspace?.id),
    enabled: isAuthenticated && !workspaceLoading,
  })
}

export function useUpdateActionItem() {
  const queryClient = useQueryClient()
  const { activeWorkspace } = useWorkspace()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../services/actionItems.service').UpdateActionItemData }) =>
      actionItemsService.update(id, data),
    onMutate: async ({ id, data }) => {
      const key = ['action-items', activeWorkspace?.id]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(
        key,
        (old: Awaited<ReturnType<typeof actionItemsService.getAll>> | undefined) =>
          old?.map((item) => (item.id === id ? { ...item, ...data } : item)) ?? [],
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['action-items', activeWorkspace?.id], context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['action-items', activeWorkspace?.id] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useToggleActionItem() {
  const queryClient = useQueryClient()
  const { activeWorkspace } = useWorkspace()

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      actionItemsService.toggle(id, completed),
    onMutate: async ({ id, completed }) => {
      const key = ['action-items', activeWorkspace?.id]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)

      queryClient.setQueryData(
        key,
        (old: ReturnType<typeof actionItemsService.getAll> extends Promise<infer T> ? T : never) =>
          old?.map((item) => (item.id === id ? { ...item, completed } : item)) ?? [],
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['action-items', activeWorkspace?.id], context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['action-items', activeWorkspace?.id] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
