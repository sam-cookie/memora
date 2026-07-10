import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Mic,
  MicOff,
  MonitorSpeaker,
  RotateCcw,
  Save,
  Settings,
  Square,
} from 'lucide-react'
import { useRecorder } from '../hooks/useRecorder'
import { useTranscription } from '../hooks/useTranscription'
import { useMinutes } from '../hooks/useMinutes'
import type { MeetingAnalysis, MeetingOverallStatus } from '@/features/ai/types'
import { useExtAuth } from '../hooks/useExtAuth'
import { useSaveMeeting } from '../hooks/useSaveMeeting'
import { APP_CONFIG } from '@/config/app'

type ActiveTab = 'minutes' | 'transcript'

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

function formatMinutesForCopy(minutes: MeetingAnalysis): string {
  const lines: string[] = [
    `# ${minutes.executiveSummary.objective}`,
    '',
    '## Overview',
    minutes.executiveSummary.paragraph,
  ]
  if (minutes.discussionTopics.length > 0) {
    lines.push('', '## Topics Discussed')
    minutes.discussionTopics.forEach((t) => {
      lines.push(`- ${t.topic}`)
      t.points.forEach((p) => lines.push(`  - ${p}`))
    })
  }
  if (minutes.actionItems.length > 0) {
    lines.push('', '## Action Items')
    minutes.actionItems.forEach((a) => {
      const assignee = a.assignee ? ` — ${a.assignee}` : ''
      lines.push(`- [ ] ${a.content}${assignee}`)
    })
  }
  if (minutes.decisions.length > 0) {
    lines.push('', '## Decisions Made')
    minutes.decisions.forEach((d) => lines.push(`- ${d.content}`))
  }
  if (minutes.risks.length > 0) {
    lines.push('', '## Risks & Blockers')
    minutes.risks.forEach((r) => lines.push(`- [${r.severity.toUpperCase()}] ${r.content}`))
  }
  if (minutes.openQuestions.length > 0) {
    lines.push('', '## Open Questions')
    minutes.openQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`))
  }
  return lines.join('\n')
}

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-gray-400',
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
}

const STATUS_LABEL: Record<MeetingOverallStatus, { label: string; color: string }> = {
  'on-track': { label: 'On Track', color: 'text-emerald-600' },
  'at-risk': { label: 'At Risk', color: 'text-amber-600' },
  blocked: { label: 'Blocked', color: 'text-red-600' },
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      {children}
    </div>
  )
}

function MinutesView({ minutes }: { minutes: MeetingAnalysis }) {
  const statusCfg = STATUS_LABEL[minutes.executiveSummary.status] ?? STATUS_LABEL['on-track']

  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      <Section title="Overview">
        <p className="text-sm leading-relaxed text-gray-800">{minutes.executiveSummary.paragraph}</p>
        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className={`font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
          {minutes.executiveSummary.keyOutcome && (
            <span>{minutes.executiveSummary.keyOutcome}</span>
          )}
        </div>
      </Section>

      {/* Discussion Topics */}
      {minutes.discussionTopics.length > 0 && (
        <Section title="Topics Discussed">
          <ul className="space-y-2">
            {minutes.discussionTopics.map((topic, i) => (
              <li key={i}>
                <p className="text-sm font-medium text-gray-800">{topic.topic}</p>
                {topic.points.length > 0 && (
                  <ul className="mt-1 space-y-1 pl-3">
                    {topic.points.map((point, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Action Items */}
      {minutes.actionItems.length > 0 && (
        <Section title="Action Items">
          <ul className="space-y-1.5">
            {minutes.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[item.priority] ?? 'bg-gray-400'}`} />
                <div className="min-w-0">
                  <p className="text-sm text-gray-800">{item.content}</p>
                  {item.assignee && (
                    <p className="text-xs text-gray-400">{item.assignee}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Decisions */}
      {minutes.decisions.length > 0 && (
        <Section title="Decisions Made">
          <ul className="space-y-1.5">
            {minutes.decisions.map((decision, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-800">{decision.content}</p>
                  {decision.context && (
                    <p className="mt-0.5 text-xs text-gray-400 leading-snug">{decision.context}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Risks */}
      {minutes.risks.length > 0 && (
        <Section title="Risks & Blockers">
          <ul className="space-y-1.5">
            {minutes.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[risk.severity] ?? 'bg-gray-400'}`} />
                <p className="text-sm text-gray-800">{risk.content}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Open Questions */}
      {minutes.openQuestions.length > 0 && (
        <Section title="Open Questions">
          <ol className="space-y-1.5">
            {minutes.openQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                <span className="shrink-0 text-xs tabular-nums text-gray-400 w-4">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  )
}

interface LoginScreenProps {
  onSignIn: (email: string, password: string) => Promise<string | null>
}

function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password) return
    setIsSubmitting(true)
    setError(null)
    const err = await onSignIn(email.trim(), password)
    if (err) setError(err)
    setIsSubmitting(false)
  }, [email, password, onSignIn])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-white p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
        <LogIn className="h-6 w-6 text-white" />
      </div>

      <div>
        <h1 className="text-lg font-semibold text-gray-900">Sign in to Memora</h1>
        <p className="mt-1 text-sm text-gray-500">
          Save minutes directly to your dashboard
        </p>
      </div>

      <div className="w-full space-y-2.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }}
          placeholder="Email"
          autoFocus
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }}
          placeholder="Password"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-left">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || !email.trim() || !password}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Sign In'
          )}
        </button>
      </div>
    </div>
  )
}

export function Panel() {
  const { session, isLoading: isLoadingAuth, signIn, signOut } = useExtAuth()

  const [apiKey, setApiKey] = useState('')
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [showKeySetup, setShowKeySetup] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('minutes')
  const [copied, setCopied] = useState(false)
  const transcriptRef = useRef<HTMLDivElement>(null)

  const {
    state,
    duration,
    audioBlob,
    error: recorderError,
    permissionDenied,
    startMic,
    startTab,
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

  const {
    minutes,
    isGenerating: isGeneratingMinutes,
    error: minutesError,
    generate: generateMinutes,
    retry: retryMinutes,
    reset: resetMinutes,
  } = useMinutes(apiKey)

  const {
    isSaving,
    savedId,
    error: saveError,
    save,
    reset: resetSave,
  } = useSaveMeeting(session)

  useEffect(() => {
    void storageGet('openai_api_key').then((stored) => {
      if (stored) setApiKey(stored)
      else setShowKeySetup(true)
    })
  }, [])

  useEffect(() => {
    if (audioBlob !== null && state === 'stopped') {
      void transcribe(audioBlob)
    }
  }, [audioBlob, state, transcribe])

  useEffect(() => {
    if (transcript) {
      void generateMinutes(transcript)
    }
  }, [transcript, generateMinutes])

  const saveApiKey = useCallback(() => {
    const key = apiKeyDraft.trim()
    if (!key) return
    chrome.storage.local.set({ openai_api_key: key })
    setApiKey(key)
    setApiKeyDraft('')
    setShowKeySetup(false)
  }, [apiKeyDraft])

  const handleCopy = useCallback(async () => {
    const text =
      activeTab === 'minutes' && minutes
        ? formatMinutesForCopy(minutes)
        : (transcript ?? '')
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [activeTab, minutes, transcript])

  const handleNewRecording = useCallback(() => {
    resetRecorder()
    resetTranscript()
    resetMinutes()
    resetSave()
    setActiveTab('minutes')
    setCopied(false)
  }, [resetRecorder, resetTranscript, resetMinutes, resetSave])

  const handleSave = useCallback(() => {
    if (!transcript || !minutes) return
    void save({ transcript, minutes, duration })
  }, [transcript, minutes, duration, save])

  const openMicSettings = useCallback(() => {
    void chrome.tabs.create({
      url: `chrome://extensions/?id=${chrome.runtime.id}`,
    })
  }, [])

  const recorderError_ = recorderError ?? transcriptionError
  const showTranscribing = state === 'stopped' && isTranscribing
  const showResults = !!transcript && !isTranscribing
  const showPermissionDenied = permissionDenied && state === 'idle'

  // ── Auth loading ──────────────────────────────────────────────
  if (isLoadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  // ── Not signed in ─────────────────────────────────────────────
  if (!session) {
    return <LoginScreen onSignIn={signIn} />
  }

  // ── Groq API key setup ────────────────────────────────────────
  if (showKeySetup) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-white p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
          <KeyRound className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Groq API Key</h1>
          <p className="mt-1 text-sm text-gray-500">
            Used for transcription and minutes — stored locally.
          </p>
        </div>
        <div className="w-full space-y-3">
          <input
            type="password"
            value={apiKeyDraft}
            onChange={(e) => setApiKeyDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveApiKey() }}
            placeholder="gsk_..."
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

  // ── Main panel ────────────────────────────────────────────────
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowKeySetup(true)}
            title="Update Groq API key"
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button
            onClick={() => void signOut()}
            title={`Sign out (${session.user.email})`}
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Permission denied ── */}
        {showPermissionDenied && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <MicOff className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Microphone blocked</p>
              <p className="mt-1 text-xs text-gray-500">
                Chrome blocked microphone access. Open extension settings to allow it, then try again.
              </p>
            </div>
            <button
              onClick={openMicSettings}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Settings className="h-4 w-4" />
              Open Extension Settings
            </button>
            <button
              onClick={handleNewRecording}
              className="text-xs text-blue-600 transition hover:text-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Idle — source picker ── */}
        {state === 'idle' && !showResults && !recorderError_ && !showPermissionDenied && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
            <p className="mb-1 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
              Choose recording source
            </p>

            <button
              onClick={() => void startTab()}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-600 px-4 py-4 text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500">
                <MonitorSpeaker className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Record Meeting</p>
                <p className="text-xs text-blue-200">
                  Google Meet · Zoom Web · any browser tab
                </p>
              </div>
            </button>

            <button
              onClick={() => void startMic()}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Mic className="h-5 w-5 text-gray-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Mic Only</p>
                <p className="text-xs text-gray-400">Records your microphone</p>
              </div>
            </button>
          </div>
        )}

        {/* ── Recording ── */}
        {state === 'recording' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm font-medium text-gray-700">Recording</span>
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
          </div>
        )}

        {/* ── Transcribing ── */}
        {showTranscribing && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">
              Transcribing {formatDuration(duration)} of audio…
            </p>
          </div>
        )}

        {/* ── Recorder / transcription error ── */}
        {recorderError_ && (
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <div className="w-full rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{recorderError_}</p>
              </div>
              <button
                onClick={handleNewRecording}
                className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Results: Minutes + Transcript tabs ── */}
        {showResults && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Meeting title */}
            {minutes && (
              <div className="shrink-0 px-4 pt-3">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {minutes.executiveSummary.objective}
                </p>
              </div>
            )}

            {/* Tab bar */}
            <div className="shrink-0 px-4 pt-2">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setActiveTab('minutes')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === 'minutes'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Minutes
                </button>
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === 'transcript'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Transcript
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {activeTab === 'minutes' && (
                <>
                  {isGeneratingMinutes && (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <p className="text-xs text-gray-400">Generating minutes…</p>
                    </div>
                  )}
                  {minutesError && !isGeneratingMinutes && (
                    <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <p className="text-xs text-red-700">{minutesError}</p>
                      </div>
                      <button
                        onClick={() => void retryMinutes()}
                        className="mt-2 w-full rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                      >
                        Retry Minutes
                      </button>
                    </div>
                  )}
                  {minutes && !isGeneratingMinutes && (
                    <MinutesView minutes={minutes} />
                  )}
                </>
              )}

              {activeTab === 'transcript' && (
                <div
                  ref={transcriptRef}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-sm leading-relaxed text-gray-800"
                >
                  {transcript}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="shrink-0 space-y-2 border-t border-gray-100 px-4 py-3">
              {/* Save to dashboard */}
              {!savedId && (
                <button
                  onClick={handleSave}
                  disabled={isSaving || !minutes || isGeneratingMinutes}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save to Dashboard
                    </>
                  )}
                </button>
              )}

              {savedId && (
                <a
                  href={`${APP_CONFIG.url}/meetings/${savedId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Saved — View in Dashboard
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              {saveError && (
                <p className="text-center text-xs text-red-600">{saveError}</p>
              )}

              {/* Copy + New */}
              <div className="flex gap-2">
                <button
                  onClick={() => void handleCopy()}
                  disabled={
                    activeTab === 'minutes'
                      ? !minutes || isGeneratingMinutes
                      : !transcript
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
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
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  New
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
