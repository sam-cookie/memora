import { useCallback, useRef, useState } from 'react'
import type { MeetingAnalysis } from '@/features/ai/types'

export type { MeetingAnalysis as MeetingMinutes }

interface ChatResponse {
  choices: Array<{ message: { content: string } }>
}

interface ChatErrorBody {
  error?: { message?: string }
}

export interface UseMinutesReturn {
  minutes: MeetingAnalysis | null
  isGenerating: boolean
  error: string | null
  generate: (transcript: string) => Promise<void>
  retry: () => Promise<void>
  reset: () => void
}

const SYSTEM_PROMPT = `You are a professional meeting secretary. Given a meeting transcript, produce structured meeting minutes as valid JSON.

Return ONLY a JSON object with this exact shape — no markdown, no explanation:
{
  "executiveSummary": {
    "objective": "One sentence describing the meeting's goal",
    "keyOutcome": "One sentence describing the main result",
    "status": "on-track" | "at-risk" | "blocked",
    "paragraph": "2-3 sentences summarising the meeting"
  },
  "discussionTopics": [
    { "topic": "Topic title", "points": ["Key point", ...] }
  ],
  "keyPoints": ["Concise key point", ...],
  "actionItems": [
    {
      "content": "Task description",
      "assignee": "Name or null",
      "priority": "critical" | "high" | "medium" | "low",
      "dueDate": "YYYY-MM-DD or null",
      "status": "not-started",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "decisions": [
    {
      "content": "Decision made",
      "context": "Why this decision was made or null",
      "impact": "Expected impact or null",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "risks": [
    {
      "content": "Risk or blocker description",
      "severity": "critical" | "high" | "medium" | "low",
      "impact": "Potential impact or null",
      "likelihood": "high" | "medium" | "low",
      "mitigation": "Suggested mitigation or null"
    }
  ],
  "openQuestions": ["Unresolved question", ...],
  "participants": ["Name", ...],
  "aiInsights": [
    { "type": "missing-owner" | "missing-deadline" | "repeated-concern" | "project-risk" | "unresolved-item" | "follow-up-needed" | "discussion-distribution", "content": "Insight text" }
  ],
  "timeline": [
    { "moment": "Opening / Mid-meeting / Closing / etc.", "description": "What happened" }
  ]
}

Rules:
- Be factual. Never invent information not present in the transcript.
- Keep every string concise (one line).
- If a section has no items, return an empty array.
- status reflects the overall meeting health based on risks/blockers mentioned.
- Infer participant names from how people address each other in the transcript.`

function parseMinutes(raw: string): MeetingAnalysis {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Model did not return a JSON object')
  const parsed: unknown = JSON.parse(jsonMatch[0])

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !('executiveSummary' in parsed)
  ) {
    throw new Error('Unexpected response shape')
  }

  const obj = parsed as Record<string, unknown>

  function str(v: unknown, fallback = ''): string {
    return typeof v === 'string' ? v : fallback
  }
  function arr<T>(v: unknown, guard: (x: unknown) => x is T): T[] {
    return Array.isArray(v) ? v.filter(guard) : []
  }
  function isString(x: unknown): x is string { return typeof x === 'string' }

  const summary = (obj.executiveSummary ?? {}) as Record<string, unknown>
  const statusVal = str(summary.status, 'on-track')
  const overallStatus = (['on-track', 'at-risk', 'blocked'] as const).includes(
    statusVal as 'on-track' | 'at-risk' | 'blocked',
  )
    ? (statusVal as 'on-track' | 'at-risk' | 'blocked')
    : 'on-track'

  return {
    executiveSummary: {
      objective: str(summary.objective, 'Meeting objective'),
      keyOutcome: str(summary.keyOutcome, ''),
      status: overallStatus,
      paragraph: str(summary.paragraph, ''),
    },
    discussionTopics: arr(obj.discussionTopics, (x): x is { topic: string; points: string[] } =>
      x !== null && typeof x === 'object' && 'topic' in (x as object),
    ).map((t) => ({
      topic: str((t as Record<string, unknown>).topic),
      points: arr((t as Record<string, unknown>).points, isString),
    })),
    keyPoints: arr(obj.keyPoints, isString),
    actionItems: arr(obj.actionItems, (x): x is Record<string, unknown> =>
      x !== null && typeof x === 'object' && 'content' in (x as object),
    ).map((a) => {
      const priority = str(a.priority, 'medium')
      const validPriority = (['critical', 'high', 'medium', 'low'] as const).includes(
        priority as 'critical' | 'high' | 'medium' | 'low',
      )
        ? (priority as 'critical' | 'high' | 'medium' | 'low')
        : ('medium' as const)
      const status = str(a.status, 'not-started')
      const validStatus = (['not-started', 'in-progress', 'completed'] as const).includes(
        status as 'not-started' | 'in-progress' | 'completed',
      )
        ? (status as 'not-started' | 'in-progress' | 'completed')
        : ('not-started' as const)
      const confidence = str(a.confidence, 'high')
      const validConfidence = (['high', 'medium', 'low'] as const).includes(
        confidence as 'high' | 'medium' | 'low',
      )
        ? (confidence as 'high' | 'medium' | 'low')
        : ('high' as const)
      return {
        content: str(a.content),
        assignee: typeof a.assignee === 'string' ? a.assignee : null,
        priority: validPriority,
        dueDate: typeof a.dueDate === 'string' ? a.dueDate : null,
        status: validStatus,
        confidence: validConfidence,
      }
    }),
    decisions: arr(obj.decisions, (x): x is Record<string, unknown> =>
      x !== null && typeof x === 'object' && 'content' in (x as object),
    ).map((d) => {
      const confidence = str(d.confidence, 'high')
      const validConfidence = (['high', 'medium', 'low'] as const).includes(
        confidence as 'high' | 'medium' | 'low',
      )
        ? (confidence as 'high' | 'medium' | 'low')
        : ('high' as const)
      return {
        content: str(d.content),
        context: typeof d.context === 'string' ? d.context : null,
        impact: typeof d.impact === 'string' ? d.impact : null,
        confidence: validConfidence,
      }
    }),
    risks: arr(obj.risks, (x): x is Record<string, unknown> =>
      x !== null && typeof x === 'object' && 'content' in (x as object),
    ).map((r) => {
      const severity = str(r.severity, 'medium')
      const validSeverity = (['critical', 'high', 'medium', 'low'] as const).includes(
        severity as 'critical' | 'high' | 'medium' | 'low',
      )
        ? (severity as 'critical' | 'high' | 'medium' | 'low')
        : ('medium' as const)
      const likelihood = str(r.likelihood, 'medium')
      const validLikelihood = (['high', 'medium', 'low'] as const).includes(
        likelihood as 'high' | 'medium' | 'low',
      )
        ? (likelihood as 'high' | 'medium' | 'low')
        : ('medium' as const)
      return {
        content: str(r.content),
        severity: validSeverity,
        impact: typeof r.impact === 'string' ? r.impact : null,
        likelihood: validLikelihood,
        mitigation: typeof r.mitigation === 'string' ? r.mitigation : null,
      }
    }),
    openQuestions: arr(obj.openQuestions, isString),
    participants: arr(obj.participants, isString),
    aiInsights: arr(obj.aiInsights, (x): x is Record<string, unknown> =>
      x !== null && typeof x === 'object' && 'type' in (x as object) && 'content' in (x as object),
    ).map((i) => {
      const validTypes = [
        'missing-owner', 'missing-deadline', 'repeated-concern',
        'project-risk', 'unresolved-item', 'follow-up-needed', 'discussion-distribution',
      ] as const
      const type = str(i.type)
      return {
        type: validTypes.includes(type as typeof validTypes[number])
          ? (type as typeof validTypes[number])
          : ('unresolved-item' as const),
        content: str(i.content),
      }
    }),
    timeline: arr(obj.timeline, (x): x is Record<string, unknown> =>
      x !== null && typeof x === 'object' && 'moment' in (x as object),
    ).map((e) => ({
      moment: str((e as Record<string, unknown>).moment),
      description: str((e as Record<string, unknown>).description),
    })),
  }
}

export function useMinutes(apiKey: string): UseMinutesReturn {
  const [minutes, setMinutes] = useState<MeetingAnalysis | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastTranscriptRef = useRef('')

  const generate = useCallback(
    async (transcript: string) => {
      if (!apiKey) return
      if (!transcript.trim()) {
        setError(
          'No speech was detected in the recording. Make sure the meeting audio was audible.',
        )
        return
      }

      lastTranscriptRef.current = transcript
      setIsGenerating(true)
      setError(null)

      try {
        const response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Transcript:\n\n${transcript}` },
              ],
              temperature: 0.2,
              max_tokens: 2048,
              response_format: { type: 'json_object' },
            }),
          },
        )

        if (!response.ok) {
          const errBody: ChatErrorBody = await response.json().catch(() => ({}))
          throw new Error(
            errBody.error?.message ?? `API error ${response.status}`,
          )
        }

        const data: ChatResponse = await response.json()
        const content = data.choices[0]?.message.content
        if (!content) throw new Error('Empty response from API')

        setMinutes(parseMinutes(content))
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to generate minutes',
        )
      } finally {
        setIsGenerating(false)
      }
    },
    [apiKey],
  )

  const retry = useCallback(async () => {
    if (lastTranscriptRef.current) {
      await generate(lastTranscriptRef.current)
    }
  }, [generate])

  const reset = useCallback(() => {
    setMinutes(null)
    setError(null)
    lastTranscriptRef.current = ''
  }, [])

  return { minutes, isGenerating, error, generate, retry, reset }
}
