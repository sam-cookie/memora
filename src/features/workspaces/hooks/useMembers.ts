import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { membersService } from '../services/members.service'
import type { WorkspaceRole } from '@/types/database'

export function useMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => membersService.getMembers(workspaceId!),
    enabled: !!workspaceId,
  })
}

export function useAddMember(workspaceId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: WorkspaceRole }) => {
      if (!user) throw new Error('Not authenticated')
      return membersService.addMemberByEmail(workspaceId, email, role, user.id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
    },
  })
}

export function useUpdateMemberRole(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceRole }) =>
      membersService.updateRole(memberId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      void queryClient.invalidateQueries({ queryKey: ['my-memberships'] })
    },
  })
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => membersService.removeMember(memberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      void queryClient.invalidateQueries({ queryKey: ['my-memberships'] })
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}
