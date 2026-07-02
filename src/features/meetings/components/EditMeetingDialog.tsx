import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/common/FormField'
import { ParticipantCombobox } from './ParticipantCombobox'
import { useUpdateMeeting, useMeetingContacts, useSetMeetingContacts } from '../hooks/useMeetingDetail'
import type { Meeting } from '@/types/database'
import type { ParticipantEntry } from '../types'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional(),
  meeting_date: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface EditMeetingDialogProps {
  meeting: Meeting
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditMeetingDialog({ meeting, open, onOpenChange }: EditMeetingDialogProps) {
  const [participants, setParticipants] = useState<ParticipantEntry[]>([])
  const update = useUpdateMeeting(meeting.id)
  const setMeetingContacts = useSetMeetingContacts(meeting.id)
  const { data: linkedContacts = [] } = useMeetingContacts(meeting.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: meeting.title,
      description: meeting.description ?? '',
      meeting_date: meeting.meeting_date
        ? new Date(meeting.meeting_date).toISOString().slice(0, 16)
        : '',
    },
  })

  // Rebuild ParticipantEntry[] whenever the dialog opens or linked contacts load
  useEffect(() => {
    if (!open) return

    reset({
      title: meeting.title,
      description: meeting.description ?? '',
      meeting_date: meeting.meeting_date
        ? new Date(meeting.meeting_date).toISOString().slice(0, 16)
        : '',
    })

    const linkedNames = new Set(linkedContacts.map((lc) => lc.contact.name.toLowerCase()))
    const entries: ParticipantEntry[] = [
      ...linkedContacts.map((lc) => ({
        type: 'contact' as const,
        contactId: lc.contact_id,
        name: lc.contact.name,
      })),
      ...(meeting.participants ?? [])
        .filter((name) => !linkedNames.has(name.toLowerCase()))
        .map((name) => ({ type: 'text' as const, name })),
    ]
    setParticipants(entries)
  }, [open, meeting, linkedContacts, reset])

  const onSubmit = handleSubmit(async (data) => {
    const participantNames = participants.map((p) => p.name)
    const contactIds = participants
      .filter((p): p is Extract<ParticipantEntry, { type: 'contact' }> => p.type === 'contact')
      .map((p) => p.contactId)

    await Promise.all([
      update.mutateAsync({
        title: data.title,
        description: data.description || null,
        meeting_date: data.meeting_date ? new Date(data.meeting_date).toISOString() : null,
        participants: participantNames.length > 0 ? participantNames : null,
      }),
      setMeetingContacts.mutateAsync(contactIds),
    ])

    onOpenChange(false)
  })

  const isPending = update.isPending || setMeetingContacts.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-1" noValidate>
          <FormField id="edit-title" label="Meeting title" error={errors.title?.message} required>
            <Input
              id="edit-title"
              placeholder="e.g. Q3 Planning Sync"
              error={!!errors.title}
              {...register('title')}
            />
          </FormField>

          <FormField id="edit-description" label="Description" error={errors.description?.message}>
            <Input
              id="edit-description"
              placeholder="Optional notes about this meeting"
              {...register('description')}
            />
          </FormField>

          <FormField id="edit-date" label="Date & time">
            <Input
              id="edit-date"
              type="datetime-local"
              className="[color-scheme:dark]"
              {...register('meeting_date')}
            />
          </FormField>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Participants</p>
            <ParticipantCombobox
              value={participants}
              onChange={setParticipants}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
