import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/providers/WorkspaceProvider'
import { participantsService } from '../services/participants.service'

function contactsKey(workspaceId: string | undefined, includeArchived: boolean, search: string) {
  return ['contacts', workspaceId, { includeArchived, search }]
}

export function useContacts(options: { includeArchived?: boolean; search?: string } = {}) {
  const { activeWorkspace } = useWorkspace()
  const { includeArchived = false, search = '' } = options

  return useQuery({
    queryKey: contactsKey(activeWorkspace?.id, includeArchived, search),
    queryFn: () =>
      participantsService.getContacts({
        workspaceId: activeWorkspace!.id,
        includeArchived,
        search,
      }),
    enabled: !!activeWorkspace,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  const { activeWorkspace } = useWorkspace()

  return useMutation({
    mutationFn: (payload: {
      name: string
      email?: string | null
      company?: string | null
      notes?: string | null
    }) => {
      if (!activeWorkspace) throw new Error('No active workspace')
      return participantsService.createContact({ workspace_id: activeWorkspace.id, ...payload })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', activeWorkspace?.id] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  const { activeWorkspace } = useWorkspace()

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      name?: string
      email?: string | null
      company?: string | null
      notes?: string | null
    }) => participantsService.updateContact(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', activeWorkspace?.id] })
    },
  })
}

export function useSetContactArchived() {
  const queryClient = useQueryClient()
  const { activeWorkspace } = useWorkspace()

  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      participantsService.setArchived(id, archived),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', activeWorkspace?.id] })
    },
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => participantsService.getContact(id),
    enabled: !!id,
  })
}

export function useContactMeetings(contactId: string) {
  return useQuery({
    queryKey: ['contact', contactId, 'meetings'],
    queryFn: () => participantsService.getContactMeetings(contactId),
    enabled: !!contactId,
  })
}

export function useContactActionItems(meetingIds: string[], contactName: string) {
  return useQuery({
    queryKey: ['contact-action-items', meetingIds, contactName],
    queryFn: () => participantsService.getContactActionItems(meetingIds, contactName),
    enabled: meetingIds.length > 0 && !!contactName,
  })
}

export function useContactDecisions(meetingIds: string[], contactName: string) {
  return useQuery({
    queryKey: ['contact-decisions', meetingIds, contactName],
    queryFn: () => participantsService.getContactDecisions(meetingIds, contactName),
    enabled: meetingIds.length > 0 && !!contactName,
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  const { activeWorkspace } = useWorkspace()

  return useMutation({
    mutationFn: (id: string) => participantsService.deleteContact(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts', activeWorkspace?.id] })
    },
  })
}
