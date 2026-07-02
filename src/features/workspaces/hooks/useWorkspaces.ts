import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { workspacesService } from '../services/workspaces.service'
import type { WorkspaceColor } from '@/types/database'

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesService.getWorkspaces(),
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (payload: {
      name: string
      description?: string | null
      icon?: string | null
      color?: WorkspaceColor
    }) => {
      if (!user) throw new Error('Not authenticated')
      return workspacesService.createWorkspace({ ...payload, owner_id: user.id })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      void queryClient.invalidateQueries({ queryKey: ['my-memberships'] })
    },
  })
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      name?: string
      description?: string | null
      icon?: string | null
      color?: WorkspaceColor
    }) => workspacesService.updateWorkspace(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => workspacesService.deleteWorkspace(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
      void queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}
