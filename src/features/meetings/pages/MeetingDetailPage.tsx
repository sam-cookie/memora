import { useState, useRef, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  Calendar,
  Users,
  Check,
  Printer,
  FileDown,
  CheckSquare,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  AlignLeft,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  Target,
  MessageSquare,
  Sparkles,
  Clock,
  BarChart2,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { ROUTES } from '@/config/routes'
import {
  useMeeting,
  useActionItems,
  useDecisions,
  useRisks,
  useFollowUpQuestions,
  useToggleActionItem,
  useUpdateMeeting,
  useMeetingContacts,
} from '../hooks/useMeetingDetail'
import { useExportPDF } from '../hooks/useExportPDF'
import { useExportDocx } from '../hooks/useExportDocx'
import { EditMeetingDialog } from '../components/EditMeetingDialog'
import { DeleteMeetingDialog } from '../components/DeleteMeetingDialog'
import { ReviewParticipantsPanel } from '../components/ReviewParticipantsPanel'
import type {
  Meeting,
  ActionItem,
  KeyDecision,
  Risk,
  FollowUpQuestion,
  ActionItemPriority,
  RiskSeverity,
} from '@/types/database'
import type {
  MeetingAnalysis,
  MeetingOverallStatus,
  Confidence,
  InsightType,
  ActionItemAI,
  DecisionAI,
  RiskAI,
} from '@/features/ai/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function getAiAnalysis(meeting: Meeting): MeetingAnalysis | null {
  if (!meeting.ai_analysis) return null
  const analysis = meeting.ai_analysis as unknown as MeetingAnalysis
  if (!analysis.executiveSummary) return null
  return analysis
}

// ─── Export helpers ────────────────────────────────────────────────────────────

function buildMarkdown(
  meeting: Meeting,
  actionItems: ActionItem[],
  decisions: KeyDecision[],
  risks: Risk[],
  questions: FollowUpQuestion[],
): string {
  const lines: string[] = [`# ${meeting.title}`, '']
  const date = meeting.processed_at ?? meeting.created_at

  lines.push(`**Date:** ${formatDate(date)}`)
  if (meeting.participants?.length) {
    lines.push(`**Participants:** ${meeting.participants.join(', ')}`)
  }
  lines.push('')

  const ai = getAiAnalysis(meeting)

  if (ai) {
    lines.push('## Executive Summary', '')
    lines.push(`**Objective:** ${ai.executiveSummary.objective}`)
    lines.push(`**Key Outcome:** ${ai.executiveSummary.keyOutcome}`)
    lines.push(`**Status:** ${capitalize(ai.executiveSummary.status)}`)
    lines.push('')
    lines.push(ai.executiveSummary.paragraph)
    lines.push('')
  } else if (meeting.summary) {
    lines.push('## Summary', '', meeting.summary, '')
  }

  if (actionItems.length > 0) {
    lines.push('## Action Items', '')
    actionItems.forEach((item) => {
      const check = item.completed ? '[x]' : '[ ]'
      const assignee = item.assignee ? ` — ${item.assignee}` : ''
      lines.push(`- ${check} ${item.content}${assignee}`)
    })
    lines.push('')
  }

  if (decisions.length > 0) {
    lines.push('## Decisions', '')
    decisions.forEach((d) => {
      lines.push(`- ${d.content}`)
      if (d.context) lines.push(`  > ${d.context}`)
    })
    lines.push('')
  }

  if (risks.length > 0) {
    lines.push('## Risks & Blockers', '')
    risks.forEach((r) => lines.push(`- [${r.severity.toUpperCase()}] ${r.content}`))
    lines.push('')
  }

  if (questions.length > 0) {
    lines.push('## Open Questions', '')
    questions.forEach((q, i) => lines.push(`${i + 1}. ${q.question}`))
    lines.push('')
  }

  if (meeting.transcript) {
    lines.push('## Transcript', '', meeting.transcript)
  }

  return lines.join('\n')
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Badge components ─────────────────────────────────────────────────────────

const OVERALL_STATUS_CONFIG: Record<MeetingOverallStatus, { label: string; color: string }> = {
  'on-track': { label: 'On Track', color: 'text-emerald-600 dark:text-emerald-400' },
  'at-risk': { label: 'At Risk', color: 'text-amber-600 dark:text-amber-400' },
  blocked: { label: 'Blocked', color: 'text-red-600 dark:text-red-400' },
}

function OverallStatusBadge({ status }: { status: MeetingOverallStatus }) {
  const cfg = OVERALL_STATUS_CONFIG[status]
  return (
    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
  )
}

const PRIORITY_TEXT: Record<ActionItemPriority, string> = {
  critical: 'text-red-500 dark:text-red-400',
  high: 'text-orange-500 dark:text-orange-400',
  medium: 'text-muted-foreground',
  low: 'text-muted-foreground/60',
}

function PriorityBadge({ priority }: { priority: ActionItemPriority }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-widest ${PRIORITY_TEXT[priority]}`}>
      {priority}
    </span>
  )
}

const SEVERITY_TEXT: Record<RiskSeverity, string> = {
  critical: 'text-red-500 dark:text-red-400',
  high: 'text-orange-500 dark:text-orange-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-muted-foreground',
}

function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-widest shrink-0 ${SEVERITY_TEXT[severity]}`}>
      {severity}
    </span>
  )
}

function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  if (confidence === 'high') return null
  return (
    <span className="text-[10px] text-muted-foreground/60 font-medium">
      {confidence === 'medium' ? 'inferred' : 'estimated'}
    </span>
  )
}

const INSIGHT_CONFIG: Record<InsightType, { label: string }> = {
  'missing-owner': { label: 'Missing Owner' },
  'missing-deadline': { label: 'Missing Deadline' },
  'repeated-concern': { label: 'Repeated Concern' },
  'project-risk': { label: 'Project Risk' },
  'unresolved-item': { label: 'Unresolved Item' },
  'follow-up-needed': { label: 'Follow-up Needed' },
  'discussion-distribution': { label: 'Discussion Distribution' },
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  count,
  children,
  accent: _accent,
  collapsible = false,
  defaultOpen = true,
}: {
  icon: LucideIcon
  title: string
  count?: number
  children: ReactNode
  accent?: string
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section>
      <div
        className={`flex items-center justify-between pb-3 border-b border-border/50 mb-5 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? open : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={collapsible ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v) } } : undefined}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground/60 tabular-nums">({count})</span>
          )}
        </div>
        {collapsible && (
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
          />
        )}
      </div>
      {open && <div>{children}</div>}
    </section>
  )
}

// ─── Executive Summary ────────────────────────────────────────────────────────

function ExecutiveSummaryCard({ summary }: { summary: MeetingAnalysis['executiveSummary'] }) {
  return (
    <section>
      <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-5">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Executive Summary</h2>
        </div>
        <OverallStatusBadge status={summary.status} />
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Objective</p>
            <p className="text-sm text-foreground leading-relaxed">{summary.objective}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Key Outcome</p>
            <p className="text-sm text-foreground leading-relaxed">{summary.keyOutcome}</p>
          </div>
        </div>
        <p className="text-sm text-foreground/75 leading-relaxed border-t border-border/40 pt-4">{summary.paragraph}</p>
      </div>
    </section>
  )
}

// ─── Discussion Topics ────────────────────────────────────────────────────────

function DiscussionTopicsSection({ topics }: { topics: MeetingAnalysis['discussionTopics'] }) {
  return (
    <SectionCard icon={MessageSquare} title="Discussion Topics" count={topics.length}>
      <div className="divide-y divide-border/40">
        {topics.map((topic, i) => (
          <div key={i} className={`space-y-2 ${i === 0 ? 'pb-4' : 'py-4'} last:pb-0`}>
            <h3 className="text-sm font-medium text-foreground">{topic.topic}</h3>
            <ul className="space-y-1.5 pl-1">
              {topic.points.map((point, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-foreground/70 leading-relaxed">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ─── Action Items (premium) ───────────────────────────────────────────────────

function PremiumActionItemsSection({
  aiItems,
  dbItems,
  onToggle,
}: {
  aiItems: ActionItemAI[]
  dbItems: ActionItem[]
  onToggle: (id: string, completed: boolean) => void
}) {
  const pending = aiItems.filter((_, i) => !dbItems[i]?.completed).length
  const done = aiItems.length - pending

  return (
    <SectionCard icon={CheckSquare} title="Action Items" count={aiItems.length} collapsible>
      {aiItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No action items extracted.</p>
      ) : (
        <div>
          {pending > 0 && done > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-border overflow-hidden">
                <div
                  className="h-full bg-foreground/30 transition-all"
                  style={{ width: `${Math.round((done / aiItems.length) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground/60 shrink-0 tabular-nums uppercase tracking-widest">{done}/{aiItems.length} done</span>
            </div>
          )}
          <div className="divide-y divide-border/40">
            {aiItems.map((item, i) => {
              const dbItem = dbItems[i]
              const completed = dbItem?.completed ?? false
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 py-3 first:pt-0 last:pb-0`}
                >
                  <button
                    aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
                    onClick={() => dbItem && onToggle(dbItem.id, !completed)}
                    disabled={!dbItem}
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30 ${
                      completed
                        ? 'border-foreground/30 bg-foreground/20 text-foreground'
                        : 'border-border hover:border-foreground/40'
                    }`}
                  >
                    {completed && <Check className="h-2.5 w-2.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${completed ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>
                      {item.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <PriorityBadge priority={item.priority} />
                      {item.assignee && (
                        <span className="text-xs text-muted-foreground">{item.assignee}</span>
                      )}
                      {item.dueDate && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatShortDate(item.dueDate)}
                        </span>
                      )}
                      <ConfidenceIndicator confidence={item.confidence} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// ─── Decisions (premium) ──────────────────────────────────────────────────────

function PremiumDecisionsSection({ decisions }: { decisions: DecisionAI[] }) {
  return (
    <SectionCard icon={Lightbulb} title="Decisions" count={decisions.length}>
      <div className="divide-y divide-border/40">
        {decisions.map((d, i) => (
          <div key={i} className={`space-y-2.5 ${i === 0 ? 'pb-4' : 'py-4'} last:pb-0`}>
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-foreground leading-snug">{d.content}</p>
              <ConfidenceIndicator confidence={d.confidence} />
            </div>
            {d.context && (
              <p className="text-sm text-muted-foreground leading-relaxed pl-3 border-l border-border/60">
                {d.context}
              </p>
            )}
            {d.impact && (
              <p className="text-xs text-muted-foreground/70 leading-relaxed">{d.impact}</p>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ─── Risks & Blockers (premium) ───────────────────────────────────────────────

const LIKELIHOOD_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

function PremiumRisksSection({ risks }: { risks: RiskAI[] }) {
  return (
    <SectionCard icon={AlertTriangle} title="Risks & Blockers" count={risks.length}>
      <div className="divide-y divide-border/40">
        {risks.map((r, i) => (
          <div key={i} className={`space-y-3 ${i === 0 ? 'pb-4' : 'py-4'} last:pb-0`}>
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-foreground leading-snug">{r.content}</p>
              <SeverityBadge severity={r.severity} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {r.impact && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Impact</p>
                  <p className="text-xs text-foreground/70 leading-relaxed">{r.impact}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Likelihood</p>
                <p className="text-xs text-foreground/70">{LIKELIHOOD_LABEL[r.likelihood]}</p>
              </div>
            </div>
            {r.mitigation && (
              <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l border-border/60">{r.mitigation}</p>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ─── Open Questions ───────────────────────────────────────────────────────────

function OpenQuestionsSection({ questions }: { questions: string[] }) {
  return (
    <SectionCard icon={HelpCircle} title="Open Questions" count={questions.length}>
      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground/50 mt-px w-4 text-right">{i + 1}.</span>
            {q}
          </li>
        ))}
      </ol>
    </SectionCard>
  )
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

function AIInsightsSection({ insights }: { insights: MeetingAnalysis['aiInsights'] }) {
  return (
    <SectionCard icon={Sparkles} title="AI Insights" count={insights.length}>
      <div className="divide-y divide-border/40">
        {insights.map((insight, i) => {
          const cfg = INSIGHT_CONFIG[insight.type]
          return (
            <div key={i} className={`${i === 0 ? 'pb-4' : 'py-4'} last:pb-0`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5">{cfg.label}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{insight.content}</p>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineSection({ timeline }: { timeline: MeetingAnalysis['timeline'] }) {
  return (
    <SectionCard icon={TrendingUp} title="Meeting Timeline" count={timeline.length}>
      <div className="space-y-0">
        {timeline.map((event, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center pt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-border shrink-0" />
              {i < timeline.length - 1 && <div className="w-px flex-1 bg-border/40 mt-1.5 mb-1.5" />}
            </div>
            <div className={`${i < timeline.length - 1 ? 'pb-4' : ''}`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">{event.moment}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ─── Progress Summary ─────────────────────────────────────────────────────────

function ProgressSummary({ actionItems, dbItems }: { actionItems: ActionItemAI[]; dbItems: ActionItem[] }) {
  const completed = dbItems.filter((i) => i.completed).length
  const total = actionItems.length
  const inProgress = actionItems.filter((_, i) => dbItems[i] && !dbItems[i].completed && dbItems[i].due_date).length
  const pending = total - completed

  return (
    <SectionCard icon={BarChart2} title="Progress Summary">
      <div className="grid grid-cols-3 divide-x divide-border/50">
        {[
          { label: 'Completed', value: completed },
          { label: 'In Progress', value: inProgress },
          { label: 'Pending', value: pending },
        ].map(({ label, value }) => (
          <div key={label} className="text-center px-4 first:pl-0 last:pr-0">
            <p className="text-2xl font-light tabular-nums text-foreground">{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ─── Transcript (collapsible) ─────────────────────────────────────────────────

function TranscriptSection({ transcript }: { transcript: string }) {
  const [open, setOpen] = useState(false)
  return (
    <SectionCard icon={AlignLeft} title="Transcript">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {open ? 'Hide' : 'Show transcript'}
      </button>
      {open && (
        <div className="mt-4 overflow-x-auto">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/60">
            {transcript}
          </pre>
        </div>
      )}
    </SectionCard>
  )
}

// ─── Legacy Document (for meetings without ai_analysis) ───────────────────────

function LegacyDocument({
  meeting,
  actionItems,
  decisions,
  risks,
  questions,
  onToggle,
}: {
  meeting: Meeting
  actionItems: ActionItem[]
  decisions: KeyDecision[]
  risks: Risk[]
  questions: FollowUpQuestion[]
  onToggle: (id: string, completed: boolean) => void
}) {
  const PRIORITY_VARIANT: Record<ActionItemPriority, 'secondary' | 'warning' | 'destructive' | 'default'> = {
    low: 'secondary',
    medium: 'warning',
    high: 'destructive',
    critical: 'destructive',
  }

  return (
    <div className="space-y-10">
      {meeting.summary && (
        <SectionCard icon={FileText} title="Summary">
          <p className="text-sm leading-relaxed text-foreground/90">{meeting.summary}</p>
        </SectionCard>
      )}

      {meeting.key_points && meeting.key_points.length > 0 && (
        <SectionCard icon={List} title="Key Points" count={meeting.key_points.length}>
          <ul className="space-y-2">
            {meeting.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {point}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard icon={CheckSquare} title="Action Items" count={actionItems.length}>
        {actionItems.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No action items extracted.</p>
        ) : (
          <ul className="space-y-3">
            {actionItems.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <button
                  aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                  onClick={() => onToggle(item.id, !item.completed)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    item.completed
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/60'
                  }`}
                >
                  {item.completed && <Check className="h-3 w-3" />}
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={PRIORITY_VARIANT[item.priority]} className="text-xs">
                      {capitalize(item.priority)}
                    </Badge>
                    {item.assignee && (
                      <span className="text-xs text-muted-foreground">→ {item.assignee}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {decisions.length > 0 && (
        <SectionCard icon={Lightbulb} title="Decisions" count={decisions.length}>
          <ul className="space-y-3">
            {decisions.map((d) => (
              <li key={d.id} className="space-y-1">
                <p className="text-sm font-medium text-foreground">{d.content}</p>
                {d.context && (
                  <p className="text-xs text-muted-foreground pl-3 border-l-2 border-border/60 leading-relaxed">
                    {d.context}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {risks.length > 0 && (
        <SectionCard icon={AlertTriangle} title="Risks & Blockers" count={risks.length}>
          <ul className="space-y-2">
            {risks.map((r) => (
              <li key={r.id} className="flex items-start gap-3 text-sm text-foreground">
                <SeverityBadge severity={r.severity} />
                {r.content}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {questions.length > 0 && (
        <SectionCard icon={HelpCircle} title="Follow-up Questions" count={questions.length}>
          <ol className="space-y-2">
            {questions.map((q, i) => (
              <li key={q.id} className="flex items-start gap-3 text-sm text-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                {q.question}
              </li>
            ))}
          </ol>
        </SectionCard>
      )}

      {meeting.transcript && (
        <SectionCard icon={AlignLeft} title="Transcript">
          <div className="rounded-lg border border-border bg-card/50 p-5 overflow-x-auto">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/80">
              {meeting.transcript}
            </pre>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─── Editable Title ───────────────────────────────────────────────────────────

interface EditableTitleProps {
  value: string
  onSave: (title: string) => void
  disabled?: boolean
}

function EditableTitle({ value, onSave, disabled }: EditableTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
    else setDraft(value)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setEditing(false); setDraft(value) }
        }}
        className="w-full text-3xl font-bold tracking-tight leading-tight bg-transparent border-none outline-none ring-0 text-foreground"
        aria-label="Meeting title"
      />
    )
  }

  return (
    <h1
      className={`text-3xl font-bold tracking-tight leading-tight text-foreground transition-opacity ${
        !disabled ? 'cursor-text hover:opacity-80' : ''
      }`}
      onClick={() => !disabled && setEditing(true)}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && setEditing(true)}
      tabIndex={disabled ? undefined : 0}
      role="heading"
      aria-level={1}
    >
      {value}
    </h1>
  )
}

// ─── Skeleton / loading views ─────────────────────────────────────────────────

function DocumentSkeleton() {
  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-12 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-9 w-3/4" />
        <div className="flex gap-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )
}

function ToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 print:hidden">
      <Skeleton className="h-8 w-24" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  )
}

function ProcessingDoc({ status }: { status: string }) {
  const label =
    status === 'transcribing'
      ? 'Transcribing audio…'
      : status === 'analyzing'
      ? 'Analyzing with AI…'
      : 'Processing your meeting…'

  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-12 space-y-8">
      <Skeleton className="h-9 w-2/3" />
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        <span>{label}</span>
        <StatusBadge status={status as never} />
      </div>
      <Separator />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 rounded animate-pulse ${i === 2 ? 'w-1/2' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const meetingId = id ?? ''
  const navigate = useNavigate()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reviewDismissed, setReviewDismissed] = useState(
    () => !!localStorage.getItem(`participants-reviewed-${meetingId}`),
  )

  const { data: meeting, isLoading, isError } = useMeeting(meetingId)
  const isCompleted = meeting?.status === 'completed'
  const isProcessing = ['pending', 'uploading', 'transcribing', 'analyzing'].includes(
    meeting?.status ?? '',
  )
  const isFailed = meeting?.status === 'failed'

  const { data: actionItems = [] } = useActionItems(meetingId, isCompleted)
  const { data: decisions = [] } = useDecisions(meetingId, isCompleted)
  const { data: risks = [] } = useRisks(meetingId, isCompleted)
  const { data: questions = [] } = useFollowUpQuestions(meetingId, isCompleted)
  const { data: meetingContacts = [] } = useMeetingContacts(meetingId)
  const toggle = useToggleActionItem(meetingId)
  const update = useUpdateMeeting(meetingId)
  const { exportPDF, isExporting } = useExportPDF()
  const { exportDocx, isExporting: isExportingDocx } = useExportDocx()

  function handleDismissReview() {
    localStorage.setItem(`participants-reviewed-${meetingId}`, '1')
    setReviewDismissed(true)
  }

  function handleExportMarkdown() {
    if (!meeting) return
    const content = buildMarkdown(meeting, actionItems, decisions, risks, questions)
    const slug = meeting.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
    downloadMarkdown(`${slug}.md`, content)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <ToolbarSkeleton />
        <DocumentSkeleton />
      </div>
    )
  }

  if (isError || !meeting) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="px-6 py-3 border-b border-border/50 print:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.meetings}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Meetings
            </Link>
          </Button>
        </div>
        <EmptyState
          icon={FileText}
          title="Meeting not found"
          description="This meeting doesn't exist or you don't have access to it."
          className="flex-1"
        />
      </div>
    )
  }

  const displayDate = meeting.processed_at ?? meeting.created_at
  const aiAnalysis = getAiAnalysis(meeting)

  return (
    <div className="flex flex-col min-h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 print:hidden sticky top-0 bg-background/95 backdrop-blur z-10">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.meetings}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Meetings
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {(isProcessing || isFailed) && <StatusBadge status={meeting.status} />}
          {isCompleted && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
                <FileDown className="h-3.5 w-3.5 mr-1.5" />
                Export Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isExportingDocx}
                onClick={() => void exportDocx({ meeting, actionItems, decisions, risks, questions })}
              >
                {isExportingDocx
                  ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  : <FileText className="h-3.5 w-3.5 mr-1.5" />}
                {isExportingDocx ? 'Exporting…' : 'Export DOCX'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting}
                onClick={() => void exportPDF({ meeting, actionItems, decisions, risks, questions })}
              >
                {isExporting
                  ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  : <Printer className="h-3.5 w-3.5 mr-1.5" />}
                {isExporting ? 'Exporting…' : 'Export PDF'}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Processing */}
      {isProcessing && <ProcessingDoc status={meeting.status} />}

      {/* Failed */}
      {isFailed && (
        <EmptyState
          icon={AlertTriangle}
          title="Processing failed"
          description="Something went wrong while processing this meeting. Try uploading again."
          className="flex-1"
        />
      )}

      {/* Document */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-3xl mx-auto w-full px-8 py-12"
        >
          {/* Title & metadata header */}
          <div className="mb-8 space-y-3">
            <EditableTitle
              value={meeting.title}
              onSave={(title) => update.mutate({ title })}
              disabled={update.isPending}
            />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {formatDate(displayDate)}
              </span>
              {meeting.duration_seconds && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {formatDuration(meeting.duration_seconds)}
                </span>
              )}
              {meeting.participants && meeting.participants.length > 0 && (() => {
                const linkedNames = new Set(meetingContacts.map((mc) => mc.contact.name.toLowerCase()))
                const unlinked = meeting.participants.filter(
                  (n) => !linkedNames.has(n.toLowerCase()),
                )
                return (
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex flex-wrap gap-1.5">
                      {meetingContacts.map((mc) => (
                        <Link
                          key={mc.contact_id}
                          to={ROUTES.participant(mc.contact_id)}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                          title="View contact profile"
                        >
                          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shrink-0">
                            {mc.contact.name.charAt(0).toUpperCase()}
                          </span>
                          {mc.contact.name}
                        </Link>
                      ))}
                      {unlinked.map((name) => (
                        <Badge key={name} variant="secondary" className="text-xs font-normal">
                          {name}
                        </Badge>
                      ))}
                    </span>
                  </span>
                )
              })()}
              {aiAnalysis && (
                <OverallStatusBadge status={aiAnalysis.executiveSummary.status} />
              )}
            </div>
          </div>

          {/* Premium layout (when ai_analysis exists) */}
          {aiAnalysis ? (
            <div className="space-y-10">
              {/* Participant review panel — shown until dismissed or all linked */}
              {!reviewDismissed && meeting.participants && meeting.participants.length > 0 && (
                <ReviewParticipantsPanel
                  meetingId={meetingId}
                  allParticipantNames={meeting.participants}
                  linkedContacts={meetingContacts}
                  onDismiss={handleDismissReview}
                />
              )}

              <ExecutiveSummaryCard summary={aiAnalysis.executiveSummary} />

              {aiAnalysis.discussionTopics.length > 0 && (
                <DiscussionTopicsSection topics={aiAnalysis.discussionTopics} />
              )}

              <PremiumActionItemsSection
                aiItems={aiAnalysis.actionItems}
                dbItems={actionItems}
                onToggle={(id, completed) => toggle.mutate({ id, completed })}
              />

              {aiAnalysis.decisions.length > 0 && (
                <PremiumDecisionsSection decisions={aiAnalysis.decisions} />
              )}

              {aiAnalysis.risks.length > 0 && (
                <PremiumRisksSection risks={aiAnalysis.risks} />
              )}

              {aiAnalysis.openQuestions.length > 0 && (
                <OpenQuestionsSection questions={aiAnalysis.openQuestions} />
              )}

              {aiAnalysis.aiInsights.length > 0 && (
                <AIInsightsSection insights={aiAnalysis.aiInsights} />
              )}

              {aiAnalysis.timeline.length > 0 && (
                <TimelineSection timeline={aiAnalysis.timeline} />
              )}

              {aiAnalysis.actionItems.length > 0 && (
                <ProgressSummary actionItems={aiAnalysis.actionItems} dbItems={actionItems} />
              )}

              {meeting.transcript && (
                <TranscriptSection transcript={meeting.transcript} />
              )}
            </div>
          ) : (
            /* Legacy layout (fallback for meetings without ai_analysis) */
            <LegacyDocument
              meeting={meeting}
              actionItems={actionItems}
              decisions={decisions}
              risks={risks}
              questions={questions}
              onToggle={(id, completed) => toggle.mutate({ id, completed })}
            />
          )}
        </motion.div>
      )}

      <EditMeetingDialog
        meeting={meeting}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteMeetingDialog
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate(ROUTES.meetings)}
      />
    </div>
  )
}
