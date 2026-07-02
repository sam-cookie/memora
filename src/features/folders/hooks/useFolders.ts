import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { foldersService } from '../services/folders.service'
import { useAuth } from '@/hooks/useAuth'
import type { FolderColor } from '@/types/database'

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersService.getFolders(),
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: FolderColor }) => {
      if (!user) throw new Error('Not authenticated')
      return foldersService.createFolder(name, color, user.id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

export function useRenameFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      foldersService.renameFolder(id, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => foldersService.deleteFolder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['folders'] })
      // Meetings that were in this folder now have folder_id = null; refetch them
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

export function useMoveMeetingToFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ meetingId, folderId }: { meetingId: string; folderId: string | null }) =>
      foldersService.moveMeetingToFolder(meetingId, folderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}
