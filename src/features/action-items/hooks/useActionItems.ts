import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actionItemsService } from '../services/actionItems.service'

export function useAllActionItems() {
  return useQuery({
    queryKey: ['action-items'],
    queryFn: () => actionItemsService.getAll(),
  })
}

export function useToggleActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      actionItemsService.toggle(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['action-items'] })
      const previous = queryClient.getQueryData(['action-items'])

      queryClient.setQueryData(
        ['action-items'],
        (old: ReturnType<typeof actionItemsService.getAll> extends Promise<infer T> ? T : never) =>
          old?.map((item) => (item.id === id ? { ...item, completed } : item)) ?? [],
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['action-items'], context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['action-items'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
