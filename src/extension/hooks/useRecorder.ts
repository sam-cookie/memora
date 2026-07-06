import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderState = 'idle' | 'recording' | 'stopped'

export interface UseRecorderReturn {
  state: RecorderState
  duration: number
  audioBlob: Blob | null
  error: string | null
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

export function useRecorder(): UseRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((t) =>
          MediaRecorder.isTypeSupported(t),
        ) ?? ''

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorderRef.current = recorder
      recorder.start(1000)
      setState('recording')
      setDuration(0)
      timerRef.current = setInterval(
        () => setDuration((d) => d + 1),
        1000,
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Microphone access denied',
      )
    }
  }, [])

  const stop = useCallback(() => {
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current?.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setState('stopped')
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setDuration(0)
    setAudioBlob(null)
    setError(null)
    chunksRef.current = []
    recorderRef.current = null
  }, [])

  return { state, duration, audioBlob, error, start, stop, reset }
}
