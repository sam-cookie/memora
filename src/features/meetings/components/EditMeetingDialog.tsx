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
import { ParticipantInput } from './ParticipantInput'
import { useUpdateMeeting } from '../hooks/useMeetingDetail'
import type { Meeting } from '@/types/database'

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
  const [participants, setParticipants] = useState<string[]>(meeting.participants ?? [])
  const update = useUpdateMeeting(meeting.id)

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

  useEffect(() => {
    if (open) {
      reset({
        title: meeting.title,
        description: meeting.description ?? '',
        meeting_date: meeting.meeting_date
          ? new Date(meeting.meeting_date).toISOString().slice(0, 16)
          : '',
      })
      setParticipants(meeting.participants ?? [])
    }
  }, [open, meeting, reset])

  const onSubmit = handleSubmit(async (data) => {
    await update.mutateAsync({
      title: data.title,
      description: data.description || null,
      meeting_date: data.meeting_date ? new Date(data.meeting_date).toISOString() : null,
      participants,
    })
    onOpenChange(false)
  })

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
            <ParticipantInput
              value={participants}
              onChange={setParticipants}
              disabled={update.isPending}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
