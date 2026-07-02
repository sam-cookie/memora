import { supabase } from '@/lib/supabase'
import { transcriptionService } from '@/features/ai/services/transcription.service'
import { analysisService } from '@/features/ai/services/analysis.service'
import { meetingsService } from './meetings.service'
import type { MeetingStatus } from '@/types/database'
import type { Json } from '@/types/database'

export type ProcessingPhase = 'transcribing' | 'analyzing' | 'saving'

interface ProcessOptions {
  meetingId: string
  userId: string
  file: File
  /** User-provided participants merged with AI-extracted ones */
  participants?: string[]
  onPhase: (phase: ProcessingPhase) => void
}

/**
 * Runs the full AI pipeline: transcribe → analyze → persist.
 * Updates the meeting status in the DB at each stage so the UI reflects real progress.
 */
export const meetingProcessingService = {
  async process({ meetingId, userId, file, participants = [], onPhase }: ProcessOptions): Promise<void> {
    const setStatus = (status: MeetingStatus) =>
      meetingsService.updateMeeting(meetingId, { status })

    // --- 1. Transcribe ---
    onPhase('transcribing')
    await setStatus('transcribing')
    const transcript = await transcriptionService.transcribe(file)
    await meetingsService.updateMeeting(meetingId, { transcript })

    // --- 2. Analyze ---
    onPhase('analyzing')
    await setStatus('analyzing')
    const analysis = await analysisService.analyze(transcript)

    // --- 3. Save ---
    onPhase('saving')

    // Merge user-provided participants with AI-extracted ones (dedupe, preserve order)
    const merged = [...new Set([...participants, ...analysis.participants])]

    await meetingsService.updateMeeting(meetingId, {
      status: 'completed',
      summary: analysis.executiveSummary.paragraph,
      key_points: analysis.keyPoints.length > 0 ? analysis.keyPoints : null,
      participants: merged.length > 0 ? merged : null,
      processed_at: new Date().toISOString(),
      // Store the full rich analysis for the premium UI
      ai_analysis: analysis as unknown as Json,
    })

    // Insert related records; skip empty arrays to avoid no-op DB calls
    const saves: Promise<unknown>[] = []

    if (analysis.actionItems.length > 0) {
      saves.push(
        supabase.from('action_items').insert(
          analysis.actionItems.map((item) => ({
            meeting_id: meetingId,
            user_id: userId,
            content: item.content,
            assignee: item.assignee,
            priority: item.priority,
            due_date: item.dueDate ?? null,
            completed: item.status === 'completed',
          })),
        ),
      )
    }

    if (analysis.decisions.length > 0) {
      saves.push(
        supabase.from('key_decisions').insert(
          analysis.decisions.map((d) => ({
            meeting_id: meetingId,
            user_id: userId,
            content: d.content,
            context: d.context,
          })),
        ),
      )
    }

    if (analysis.risks.length > 0) {
      saves.push(
        supabase.from('risks').insert(
          analysis.risks.map((r) => ({
            meeting_id: meetingId,
            user_id: userId,
            content: r.content,
            severity: r.severity,
          })),
        ),
      )
    }

    if (analysis.openQuestions.length > 0) {
      saves.push(
        supabase.from('follow_up_questions').insert(
          analysis.openQuestions.map((q) => ({
            meeting_id: meetingId,
            user_id: userId,
            question: q,
          })),
        ),
      )
    }

    await Promise.all(saves)
  },
}
