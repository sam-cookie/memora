import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingsService } from '../services/meetings.service'
import type { MeetingUpdate } from '@/types/database'

export function useMeetingContacts(meetingId: string) {
  return useQuery({
    queryKey: ['meeting', meetingId, 'contacts'],
    queryFn: () => meetingsService.getMeetingContacts(meetingId),
    enabled: !!meetingId,
  })
}

export function useSetMeetingContacts(meetingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contactIds: string[]) => meetingsService.setMeetingContacts(meetingId, contactIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meeting', meetingId, 'contacts'] })
    },
  })
}

const PROCESSING_STATUSES = new Set(['pending', 'uploading', 'transcribing', 'analyzing'])

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: () => meetingsService.getMeeting(id),
    enabled: !!id,
    // Poll while the meeting is still being processed
    refetchInterval: (query) =>
      query.state.data && PROCESSING_STATUSES.has(query.state.data.status) ? 3000 : false,
  })
}

export function useActionItems(meetingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['meeting', meetingId, 'action-items'],
    queryFn: () => meetingsService.getActionItems(meetingId),
    enabled: enabled && !!meetingId,
  })
}

export function useDecisions(meetingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['meeting', meetingId, 'decisions'],
    queryFn: () => meetingsService.getDecisions(meetingId),
    enabled: enabled && !!meetingId,
  })
}

export function useRisks(meetingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['meeting', meetingId, 'risks'],
    queryFn: () => meetingsService.getRisks(meetingId),
    enabled: enabled && !!meetingId,
  })
}

export function useFollowUpQuestions(meetingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['meeting', meetingId, 'follow-up'],
    queryFn: () => meetingsService.getFollowUpQuestions(meetingId),
    enabled: enabled && !!meetingId,
  })
}

export function useToggleActionItem(meetingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      meetingsService.toggleActionItem(id, completed),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meeting', meetingId, 'action-items'] })
    },
  })
}

export function useUpdateMeeting(meetingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MeetingUpdate) => meetingsService.updateMeeting(meetingId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['meeting', meetingId], updated)
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => meetingsService.deleteMeeting(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.removeQueries({ queryKey: ['meeting', id] })
    },
  })
}
