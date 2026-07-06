import { useCallback, useState } from 'react'

interface WhisperResponse {
  text: string
}

interface WhisperErrorBody {
  error?: { message?: string }
}

export interface UseTranscriptionReturn {
  transcript: string | null
  isTranscribing: boolean
  error: string | null
  transcribe: (blob: Blob) => Promise<void>
  reset: () => void
}

export function useTranscription(apiKey: string): UseTranscriptionReturn {
  const [transcript, setTranscript] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transcribe = useCallback(
    async (blob: Blob) => {
      if (!apiKey) {
        setError('OpenAI API key is required')
        return
      }

      setIsTranscribing(true)
      setError(null)

      try {
        const body = new FormData()
        body.append('file', blob, 'recording.webm')
        body.append('model', 'whisper-1')

        const response = await fetch(
          'https://api.openai.com/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body,
          },
        )

        if (!response.ok) {
          const errBody: WhisperErrorBody = await response
            .json()
            .catch(() => ({}))
          throw new Error(
            errBody.error?.message ?? `API error ${response.status}`,
          )
        }

        const data: WhisperResponse = await response.json()
        setTranscript(data.text)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Transcription failed',
        )
      } finally {
        setIsTranscribing(false)
      }
    },
    [apiKey],
  )

  const reset = useCallback(() => {
    setTranscript(null)
    setError(null)
  }, [])

  return { transcript, isTranscribing, error, transcribe, reset }
}
