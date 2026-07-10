import { useCallback, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database'
import type { MeetingAnalysis } from '@/features/ai/types'

interface SaveInput {
  transcript: string
  minutes: MeetingAnalysis
  duration: number
}

export interface UseSaveMeetingReturn {
  isSaving: boolean
  savedId: string | null
  error: string | null
  save: (input: SaveInput) => Promise<void>
  reset: () => void
}

export function useSaveMeeting(session: Session | null): UseSaveMeetingReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(
    async ({ transcript, minutes, duration }: SaveInput) => {
      if (!session) return

      setIsSaving(true)
      setError(null)

      try {
        const { data: memberships } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', session.user.id)
          .order('created_at')
          .limit(1)

        const workspaceId = memberships?.[0]?.workspace_id ?? null

        // Derive a plain summary and key_points from the structured analysis for
        // the legacy columns (used in list views and search).
        const summary = minutes.executiveSummary.paragraph
        const key_points = minutes.keyPoints.length > 0
          ? minutes.keyPoints
          : minutes.discussionTopics.map((t) => t.topic)

        const participants = minutes.participants.length > 0
          ? minutes.participants
          : null

        const { data: meeting, error: meetingErr } = await supabase
          .from('meetings')
          .insert({
            user_id: session.user.id,
            workspace_id: workspaceId,
            title: minutes.executiveSummary.objective.slice(0, 120),
            transcript,
            summary,
            key_points,
            participants,
            status: 'completed' as const,
            duration_seconds: duration,
            meeting_date: new Date().toISOString(),
            processed_at: new Date().toISOString(),
            ai_analysis: minutes as unknown as Json,
          })
          .select('id')
          .single()

        if (meetingErr) throw meetingErr

        // Save action items
        if (minutes.actionItems.length > 0) {
          const { error: aiErr } = await supabase.from('action_items').insert(
            minutes.actionItems.map((item) => ({
              meeting_id: meeting.id,
              user_id: session.user.id,
              content: item.content,
              assignee: item.assignee,
              priority: item.priority,
              due_date: item.dueDate,
              completed: false,
            })),
          )
          if (aiErr) console.warn('Action items insert failed:', aiErr.message)
        }

        // Save decisions
        if (minutes.decisions.length > 0) {
          const { error: decisionsErr } = await supabase.from('key_decisions').insert(
            minutes.decisions.map((d) => ({
              meeting_id: meeting.id,
              user_id: session.user.id,
              content: d.content,
              context: d.context,
            })),
          )
          if (decisionsErr) console.warn('Decisions insert failed:', decisionsErr.message)
        }

        // Save risks
        if (minutes.risks.length > 0) {
          const { error: risksErr } = await supabase.from('risks').insert(
            minutes.risks.map((r) => ({
              meeting_id: meeting.id,
              user_id: session.user.id,
              content: r.content,
              severity: r.severity,
            })),
          )
          if (risksErr) console.warn('Risks insert failed:', risksErr.message)
        }

        // Save follow-up questions
        if (minutes.openQuestions.length > 0) {
          const { error: questionsErr } = await supabase.from('follow_up_questions').insert(
            minutes.openQuestions.map((q) => ({
              meeting_id: meeting.id,
              user_id: session.user.id,
              question: q,
            })),
          )
          if (questionsErr) console.warn('Questions insert failed:', questionsErr.message)
        }

        setSavedId(meeting.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save meeting')
      } finally {
        setIsSaving(false)
      }
    },
    [session],
  )

  const reset = useCallback(() => {
    setSavedId(null)
    setError(null)
  }, [])

  return { isSaving, savedId, error, save, reset }
}
