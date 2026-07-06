import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Mic,
  RotateCcw,
  Square,
} from 'lucide-react'
import { useRecorder } from '../hooks/useRecorder'
import { useTranscription } from '../hooks/useTranscription'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function storageGet(key: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (items) => {
      const value: unknown = items[key]
      resolve(typeof value === 'string' ? value : undefined)
    })
  })
}

export function Panel() {
  const [apiKey, setApiKey] = useState('')
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [showKeySetup, setShowKeySetup] = useState(false)
  const [copied, setCopied] = useState(false)
  const transcriptRef = useRef<HTMLDivElement>(null)

  const {
    state,
    duration,
    audioBlob,
    error: recorderError,
    start,
    stop,
    reset: resetRecorder,
  } = useRecorder()

  const {
    transcript,
    isTranscribing,
    error: transcriptionError,
    transcribe,
    reset: resetTranscript,
  } = useTranscription(apiKey)

  useEffect(() => {
    void storageGet('openai_api_key').then((stored) => {
      if (stored) {
        setApiKey(stored)
      } else {
        setShowKeySetup(true)
      }
    })
  }, [])

  useEffect(() => {
    if (audioBlob !== null && state === 'stopped') {
      void transcribe(audioBlob)
    }
  }, [audioBlob, state, transcribe])

  const saveApiKey = useCallback(() => {
    const key = apiKeyDraft.trim()
    if (!key) return
    chrome.storage.local.set({ openai_api_key: key })
    setApiKey(key)
    setApiKeyDraft('')
    setShowKeySetup(false)
  }, [apiKeyDraft])

  const handleCopy = useCallback(async () => {
    if (!transcript) return
    await navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [transcript])

  const handleNewRecording = useCallback(() => {
    resetRecorder()
    resetTranscript()
  }, [resetRecorder, resetTranscript])

  const error = recorderError ?? transcriptionError
  const showTranscribing = state === 'stopped' && isTranscribing
  const showTranscript = !!transcript && !isTranscribing

  if (showKeySetup) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-white p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
          <KeyRound className="h-6 w-6 text-white" />
        </div>

        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            OpenAI API Key
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Stored locally — never leaves your browser.
          </p>
        </div>

        <div className="w-full space-y-3">
          <input
            type="password"
            value={apiKeyDraft}
            onChange={(e) => setApiKeyDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveApiKey()
            }}
            placeholder="sk-..."
            autoFocus
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={saveApiKey}
            disabled={!apiKeyDraft.trim()}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40"
          >
            Save &amp; Continue
          </button>
        </div>

        {apiKey && (
          <button
            onClick={() => setShowKeySetup(false)}
            className="text-xs text-gray-400 transition hover:text-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <Mic className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Memora</span>
        </div>
        <button
          onClick={() => setShowKeySetup(true)}
          title="Update API key"
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <KeyRound className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden p-6">
        {/* Idle */}
        {state === 'idle' && !showTranscript && !error && (
          <>
            <p className="text-sm text-gray-500">Ready to record</p>
            <button
              onClick={() => void start()}
              className="group flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-600/30 transition hover:scale-105 hover:bg-blue-700 active:scale-95"
            >
              <Mic className="h-8 w-8 text-white" />
            </button>
            <p className="text-xs text-gray-400">Tap to start</p>
          </>
        )}

        {/* Recording */}
        {state === 'recording' && (
          <>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm font-medium text-gray-700">
                Recording
              </span>
            </div>
            <div className="font-mono text-4xl font-light tabular-nums text-gray-900">
              {formatDuration(duration)}
            </div>
            <button
              onClick={stop}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30 transition hover:scale-105 hover:bg-red-600 active:scale-95"
            >
              <Square className="h-7 w-7 fill-white text-white" />
            </button>
            <p className="text-xs text-gray-400">Tap to stop &amp; transcribe</p>
          </>
        )}

        {/* Transcribing */}
        {showTranscribing && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">
              Transcribing {formatDuration(duration)} of audio…
            </p>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="w-full rounded-xl border border-red-100 bg-red-50 p-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={handleNewRecording}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Try again
            </button>
          </div>
        )}

        {/* Transcript */}
        {showTranscript && (
          <div className="flex w-full flex-1 flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Transcript
              </span>
              <span className="text-xs text-gray-400">
                {formatDuration(duration)}
              </span>
            </div>

            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-sm leading-relaxed text-gray-800"
            >
              {transcript}
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => void handleCopy()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleNewRecording}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <RotateCcw className="h-4 w-4" />
                New
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
