import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/common/FormField'
import { FileDropzone } from '../components/FileDropzone'
import { UploadProgress } from '../components/UploadProgress'
import { useUploadMeeting } from '../hooks/useUploadMeeting'
import { ROUTES } from '@/config/routes'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional(),
})

type FormData = z.infer<typeof schema>

const PROCESSING_PHASES = new Set(['uploading', 'transcribing', 'analyzing', 'saving'])

export function NewMeetingPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const { phase, uploadProgress, meetingId, error, upload, reset } = useUploadMeeting()

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Auto-redirect when processing completes
  useEffect(() => {
    if (phase === 'success' && meetingId) {
      navigate(ROUTES.meeting(meetingId), { replace: true })
    }
  }, [phase, meetingId, navigate])

  const onSubmit = async (data: FormData) => {
    if (!file) {
      setFileError('Please select a file to upload.')
      return
    }
    setFileError(null)
    await upload({ ...data, file })
  }

  const handleReset = () => {
    reset()
    resetForm()
    setFile(null)
    setFileError(null)
  }

  const isProcessing = PROCESSING_PHASES.has(phase)

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold">New Meeting</h1>
        <p className="text-sm text-muted-foreground">Upload a recording or transcript</p>
      </div>

      {isProcessing ? (
        <UploadProgress phase={phase} uploadProgress={uploadProgress} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField id="title" label="Meeting title" error={errors.title?.message} required>
            <Input
              id="title"
              placeholder="e.g. Q3 Planning Sync"
              autoFocus
              error={!!errors.title}
              {...register('title')}
            />
          </FormField>

          <FormField id="description" label="Description" error={errors.description?.message}>
            <Input
              id="description"
              placeholder="Optional notes about this meeting"
              {...register('description')}
            />
          </FormField>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              File <span className="text-destructive" aria-hidden="true">*</span>
            </p>
            <FileDropzone value={file} onChange={setFile} error={fileError ?? undefined} />
          </div>

          {phase === 'error' && error && (
            <div className="space-y-2" role="alert">
              <p className="text-sm text-destructive">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                Try again
              </Button>
            </div>
          )}

          {phase !== 'error' && (
            <Button type="submit" className="w-full">
              Upload & Analyze
            </Button>
          )}
        </form>
      )}
    </div>
  )
}
