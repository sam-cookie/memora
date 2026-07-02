import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/common/FormField'
import { FileDropzone } from './FileDropzone'
import { UploadProgress } from './UploadProgress'
import { ParticipantCombobox } from './ParticipantCombobox'
import { useUploadMeeting } from '../hooks/useUploadMeeting'
import type { ParticipantEntry } from '../types'
import { ROUTES } from '@/config/routes'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional(),
  meeting_date: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const PROCESSING_PHASES = new Set(['uploading', 'transcribing', 'analyzing', 'saving'])

interface NewMeetingFormProps {
  /** Called when processing completes and the meeting is ready. */
  onSuccess?: (meetingId: string) => void
  /** Cancel handler — only shown when provided (e.g. inside a modal). */
  onCancel?: () => void
  /** When true the form is inside a dialog; adjusts submit button label. */
  isDialog?: boolean
}

export function NewMeetingForm({ onSuccess, onCancel, isDialog = false }: NewMeetingFormProps) {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<ParticipantEntry[]>([])
  const { phase, uploadProgress, meetingId, error, upload, reset } = useUploadMeeting()

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (phase === 'success' && meetingId) {
      if (onSuccess) {
        onSuccess(meetingId)
      } else {
        navigate(ROUTES.meeting(meetingId), { replace: true })
      }
    }
  }, [phase, meetingId, navigate, onSuccess])

  const onSubmit = async (data: FormData) => {
    if (!file) {
      setFileError('Please select a file to upload.')
      return
    }
    setFileError(null)
    const meetingDate = data.meeting_date
      ? new Date(data.meeting_date).toISOString()
      : new Date().toISOString()
    await upload({
      title: data.title,
      description: data.description,
      file,
      participants,
      meetingDate,
    })
  }

  const handleReset = () => {
    reset()
    resetForm()
    setFile(null)
    setFileError(null)
    setParticipants([])
  }

  const isProcessing = PROCESSING_PHASES.has(phase)

  if (isProcessing) {
    return <UploadProgress phase={phase} uploadProgress={uploadProgress} />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Title */}
      <FormField id="title" label="Meeting title" error={errors.title?.message} required>
        <Input
          id="title"
          placeholder="e.g. Q3 Planning Sync"
          autoFocus
          error={!!errors.title}
          {...register('title')}
        />
      </FormField>

      {/* Description */}
      <FormField id="description" label="Description" error={errors.description?.message}>
        <Input
          id="description"
          placeholder="Optional notes about this meeting"
          {...register('description')}
        />
      </FormField>

      {/* Date & time */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="meeting_date" label="Date & time" error={errors.meeting_date?.message}>
          <Input
            id="meeting_date"
            type="datetime-local"
            {...register('meeting_date')}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave blank to use today's date and time.
          </p>
        </FormField>

        <FormField id="timezone" label="Time zone">
          <Input
            id="timezone"
            value={Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}
            readOnly
            className="bg-surface-1 text-muted-foreground cursor-default"
          />
        </FormField>
      </div>

      {/* Participants */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Participants</p>
          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded-md bg-surface-2">
            Optional
          </span>
        </div>
        <ParticipantCombobox value={participants} onChange={setParticipants} disabled={isProcessing} />
        <p className="text-xs text-muted-foreground">
          Optional — AI will also detect participants from the transcript.
        </p>
      </div>

      {/* File */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">
          File <span className="text-destructive" aria-hidden="true">*</span>
        </p>
        <FileDropzone value={file} onChange={setFile} error={fileError ?? undefined} />
      </div>

      {/* Error state */}
      {phase === 'error' && error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2" role="alert">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            Try again
          </Button>
        </div>
      )}

      {/* Actions */}
      {phase !== 'error' && (
        <div className={isDialog ? 'flex gap-3 pt-1' : 'pt-1'}>
          {isDialog && onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" className={isDialog ? 'flex-1' : 'w-full'}>
            {isDialog ? 'Create Meeting' : 'Upload & Analyze'}
          </Button>
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <Lock className="h-3 w-3 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground/50">
          Your data is secure and stored privately.
        </p>
      </div>
    </form>
  )
}
