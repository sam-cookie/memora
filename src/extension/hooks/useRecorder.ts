import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderState = 'idle' | 'recording' | 'stopped'

export interface UseRecorderReturn {
  state: RecorderState
  duration: number
  audioBlob: Blob | null
  error: string | null
  permissionDenied: boolean
  startMic: () => Promise<void>
  startTab: () => Promise<void>
  stop: () => void
  reset: () => void
}

export function useRecorder(): UseRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

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

  const startRecording = useCallback((stream: MediaStream) => {
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
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
  }, [])

  const startMic = useCallback(async () => {
    setError(null)
    setPermissionDenied(false)

    try {
      const status = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })
      if (status.state === 'denied') {
        setPermissionDenied(true)
        return
      }
    } catch {
      // permissions API unavailable — fall through to getUserMedia
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      startRecording(stream)
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setPermissionDenied(true)
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Plug in a microphone and try again.')
        } else {
          setError(`Microphone error: ${err.message}`)
        }
      } else {
        setError(err instanceof Error ? err.message : 'Microphone error')
      }
    }
  }, [startRecording])

  const startTab = useCallback(async () => {
    setError(null)
    setPermissionDenied(false)

    try {
      const response = (await chrome.runtime.sendMessage({
        type: 'GET_TAB_STREAM_ID',
      })) as { streamId?: string; error?: string }

      if (response.error || !response.streamId) {
        setError(response.error ?? 'Could not start meeting capture.')
        return
      }

      // chromeMediaSource is Chrome-specific and not in the standard TS types
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: response.streamId,
          },
        } as unknown as MediaTrackConstraints,
        video: false,
      })

      startRecording(stream)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to capture meeting audio.',
      )
    }
  }, [startRecording])

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
    setPermissionDenied(false)
    chunksRef.current = []
    recorderRef.current = null
  }, [])

  return {
    state,
    duration,
    audioBlob,
    error,
    permissionDenied,
    startMic,
    startTab,
    stop,
    reset,
  }
}
