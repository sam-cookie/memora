import { useMemo, useState } from 'react'
import { useMatch } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, X } from 'lucide-react'
import { meetingsService } from '@/features/meetings/services/meetings.service'
import type { Database } from '@/types/database'
import { ChatPanel } from './ChatPanel'

type Meeting = Database['public']['Tables']['meetings']['Row']
type ActionItem = Database['public']['Tables']['action_items']['Row']
type Decision = Database['public']['Tables']['key_decisions']['Row']
type Risk = Database['public']['Tables']['risks']['Row']

function buildMeetingContext(
  meeting: Meeting,
  actionItems: ActionItem[],
  decisions: Decision[],
  risks: Risk[],
): string {
  const lines: string[] = ['CURRENT MEETING CONTEXT', '']

  lines.push(`Title: ${meeting.title}`)
  if (meeting.meeting_date) {
    lines.push(
      `Date: ${new Date(meeting.meeting_date).toLocaleDateString('en-US', { dateStyle: 'long' })}`,
    )
  }
  if (meeting.status) lines.push(`Status: ${meeting.status}`)
  if (meeting.description) lines.push(`Description: ${meeting.description}`)
  lines.push('')

  if (meeting.summary) {
    lines.push('Summary:', meeting.summary, '')
  }

  if (meeting.key_points && meeting.key_points.length > 0) {
    lines.push('Key Points:')
    meeting.key_points.forEach((p) => lines.push(`• ${p}`))
    lines.push('')
  }

  if (meeting.participants && meeting.participants.length > 0) {
    lines.push(`Participants: ${meeting.participants.join(', ')}`, '')
  }

  if (actionItems.length > 0) {
    lines.push(`Action Items (${actionItems.length}):`)
    actionItems.forEach((a) => {
      const status = a.completed ? 'completed' : 'open'
      lines.push(`• ${a.content} — ${a.assignee ?? 'unassigned'} · ${a.priority} · ${status}`)
    })
    lines.push('')
  }

  if (decisions.length > 0) {
    lines.push(`Decisions (${decisions.length}):`)
    decisions.forEach((d) => {
      lines.push(`• ${d.content}`)
      if (d.context) lines.push(`  Context: ${d.context}`)
    })
    lines.push('')
  }

  if (risks.length > 0) {
    lines.push(`Risks & Blockers (${risks.length}):`)
    risks.forEach((r) => lines.push(`• ${r.content} (severity: ${r.severity})`))
    lines.push('')
  }

  if (meeting.transcript) {
    const truncated = meeting.transcript.slice(0, 3000)
    lines.push('Transcript excerpt:')
    lines.push(truncated)
    if (meeting.transcript.length > 3000) lines.push('[transcript truncated for brevity]')
  }

  return lines.join('\n')
}

const GENERAL_CONTEXT = `GENERAL CONTEXT

The user is viewing their Memora dashboard. You have no specific meeting open right now.
Help them navigate their meeting history, understand patterns, or answer general questions about the application.
If they ask about a specific meeting, suggest they open that meeting and ask you there for richer context.`

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  const match = useMatch('/meetings/:id')
  const meetingId = match?.params['id']

  const { data: meeting } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => meetingsService.getMeeting(meetingId!),
    enabled: !!meetingId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: actionItems = [] } = useQuery({
    queryKey: ['action-items', meetingId],
    queryFn: () => meetingsService.getActionItems(meetingId!),
    enabled: !!meetingId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: decisions = [] } = useQuery({
    queryKey: ['decisions', meetingId],
    queryFn: () => meetingsService.getDecisions(meetingId!),
    enabled: !!meetingId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: risks = [] } = useQuery({
    queryKey: ['risks', meetingId],
    queryFn: () => meetingsService.getRisks(meetingId!),
    enabled: !!meetingId,
    staleTime: 5 * 60 * 1000,
  })

  const contextString = useMemo(() => {
    if (meeting) {
      return buildMeetingContext(meeting, actionItems, decisions, risks)
    }
    return GENERAL_CONTEXT
  }, [meeting, actionItems, decisions, risks])

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <ChatPanel
            contextString={contextString}
            meetingTitle={meeting?.title}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30"
        aria-label={isOpen ? 'Close Memo' : 'Open Memo'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Bot className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
