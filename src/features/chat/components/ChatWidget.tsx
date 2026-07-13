import { useMemo, useState } from 'react'
import { useMatch } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, X } from 'lucide-react'
import { meetingsService } from '@/features/meetings/services/meetings.service'
import {
  useDashboardStats,
  useAllActionItems,
  useRecentDecisions,
} from '@/features/dashboard/hooks/useDashboard'
import { useMeetings } from '@/features/meetings/hooks/useMeetings'
import type { Database } from '@/types/database'
import type { DashboardStats, ActionItemWithMeeting, RecentDecision } from '@/features/dashboard/services/dashboard.service'
import { useActionItemTools } from '../hooks/useActionItemTools'
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

  lines.push(`Meeting ID: ${meeting.id}`)
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
      lines.push(`• [id:${a.id}] ${a.content} — ${a.assignee ?? 'unassigned'} · ${a.priority} · ${status}`)
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

function buildDashboardContext(
  stats: DashboardStats,
  allMeetings: Meeting[],
  allActionItems: ActionItemWithMeeting[],
  recentDecisions: RecentDecision[],
): string {
  const lines: string[] = ['DASHBOARD CONTEXT', '']

  lines.push('## Stats')
  lines.push(`• Total meetings: ${stats.totalMeetings}`)
  lines.push(`• Completed meetings: ${stats.completedMeetings}`)
  lines.push(`• Open action items: ${stats.openActionItems}`)
  lines.push(`• Total action items: ${stats.totalActionItems}`)
  lines.push('')

  if (allMeetings.length > 0) {
    lines.push(`## All Meetings (${allMeetings.length})`)
    allMeetings.forEach((m) => {
      const date = m.meeting_date
        ? new Date(m.meeting_date).toLocaleDateString('en-US', { dateStyle: 'medium' })
        : 'no date'
      const participants = m.participants && m.participants.length > 0
        ? m.participants.join(', ')
        : 'none listed'
      lines.push(`• [id:${m.id}] ${m.title} — ${date} — ${m.status} — participants: ${participants}`)
    })
    lines.push('')
  }

  const openItems = allActionItems.filter((a) => !a.completed)
  const completedItems = allActionItems.filter((a) => a.completed)

  if (openItems.length > 0) {
    lines.push(`## Open Action Items (${openItems.length})`)
    openItems.forEach((a) => {
      const meeting = a.meetings?.title ?? 'unknown meeting'
      const due = a.due_date
        ? new Date(a.due_date).toLocaleDateString('en-US', { dateStyle: 'medium' })
        : 'no due date'
      lines.push(`• [id:${a.id}] [meeting_id:${a.meeting_id}] [${a.priority}] ${a.content} — ${a.assignee ?? 'unassigned'} · due ${due} · from "${meeting}"`)
    })
    lines.push('')
  } else {
    lines.push('## Open Action Items\nNone.')
    lines.push('')
  }

  if (completedItems.length > 0) {
    lines.push(`## Completed Action Items (${completedItems.length})`)
    completedItems.forEach((a) => {
      const meeting = a.meetings?.title ?? 'unknown meeting'
      lines.push(`• [id:${a.id}] [meeting_id:${a.meeting_id}] [${a.priority}] ${a.content} — ${a.assignee ?? 'unassigned'} · from "${meeting}"`)
    })
    lines.push('')
  }

  if (recentDecisions.length > 0) {
    lines.push('## Recent Decisions')
    recentDecisions.forEach((d) => {
      const meeting = d.meetings?.title ?? 'unknown meeting'
      lines.push(`• ${d.content} — from "${meeting}"`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  const match = useMatch('/meetings/:id')
  const meetingId = match?.params['id']

  // Meeting-scoped data (only when viewing a specific meeting)
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

  // Dashboard-wide data (always fetched for global context)
  const { data: stats } = useDashboardStats()
  const { data: allMeetings = [] } = useMeetings()
  const { data: allActionItems = [] } = useAllActionItems()
  const { data: recentDecisions = [] } = useRecentDecisions()

  const { handlers } = useActionItemTools(meetingId)

  const contextString = useMemo(() => {
    if (meeting) {
      return buildMeetingContext(meeting, actionItems, decisions, risks)
    }
    if (stats) {
      return buildDashboardContext(stats, allMeetings, allActionItems, recentDecisions)
    }
    return 'CONTEXT\n\nLoading your dashboard data…'
  }, [meeting, actionItems, decisions, risks, stats, allMeetings, allActionItems, recentDecisions])

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <ChatPanel
            contextString={contextString}
            meetingTitle={meeting?.title}
            toolHandlers={handlers}
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
