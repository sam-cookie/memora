import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { meetingsService } from '../services/meetings.service'
import { meetingProcessingService, type ProcessingPhase } from '../services/meeting-processing.service'

export type UploadPhase =
  | 'idle'
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'saving'
  | 'success'
  | 'error'

interface UploadState {
  phase: UploadPhase
  /** Upload progress 0–100, relevant only during the 'uploading' phase. */
  uploadProgress: number
  meetingId: string | null
  error: string | null
}

interface UploadInput {
  title: string
  description?: string
  participants?: string[]
  meetingDate?: string
  file: File
}

const INITIAL: UploadState = {
  phase: 'idle',
  uploadProgress: 0,
  meetingId: null,
  error: null,
}

export function useUploadMeeting() {
  const { user } = useAuth()
  const [state, setState] = useState<UploadState>(INITIAL)

  const upload = useCallback(
    async ({ title, description, participants, meetingDate, file }: UploadInput) => {
      if (!user) return

      setState({ phase: 'uploading', uploadProgress: 0, meetingId: null, error: null })

      try {
        // 1. Create DB record
        const meeting = await meetingsService.createMeeting({
          user_id: user.id,
          title,
          description: description ?? null,
          participants: participants && participants.length > 0 ? participants : null,
          meeting_date: meetingDate ?? new Date().toISOString(),
          status: 'uploading',
          file_type: file.type,
          file_size_bytes: file.size,
        })

        // 2. Upload file to storage
        const { filePath } = await meetingsService.uploadRecording(
          user.id,
          meeting.id,
          file,
          (percent) => setState((prev) => ({ ...prev, uploadProgress: percent })),
        )

        await meetingsService.updateMeeting(meeting.id, { file_path: filePath })

        // 3. Run AI pipeline (transcribe → analyze → save)
        await meetingProcessingService.process({
          meetingId: meeting.id,
          userId: user.id,
          file,
          participants: participants ?? [],
          onPhase: (phase: ProcessingPhase) =>
            setState((prev) => ({ ...prev, phase })),
        })

        setState({ phase: 'success', uploadProgress: 100, meetingId: meeting.id, error: null })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        setState((prev) => ({ ...prev, phase: 'error', error: message }))
      }
    },
    [user],
  )

  const reset = useCallback(() => setState(INITIAL), [])

  return { ...state, upload, reset }
}
