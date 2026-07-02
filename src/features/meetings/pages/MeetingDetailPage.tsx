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
  UserX,
  RefreshCw,
  BarChart2,
  CircleEllipsis,
  ArrowRight,
  ShieldAlert,
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
} from '../hooks/useMeetingDetail'
import { useExportPDF } from '../hooks/useExportPDF'
import { EditMeetingDialog } from '../components/EditMeetingDialog'
import { DeleteMeetingDialog } from '../components/DeleteMeetingDialog'
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
  return meeting.ai_analysis as unknown as MeetingAnalysis
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

const OVERALL_STATUS_CONFIG: Record<MeetingOverallStatus, { label: string; className: string }> = {
  'on-track': {
    label: 'On Track',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  },
  'at-risk': {
    label: 'At Risk',
    className: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
  },
}

function OverallStatusBadge({ status }: { status: MeetingOverallStatus }) {
  const cfg = OVERALL_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  )
}

const PRIORITY_CONFIG: Record<ActionItemPriority, { className: string }> = {
  critical: { className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  high: { className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  medium: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  low: { className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

function PriorityBadge({ priority }: { priority: ActionItemPriority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cfg.className}`}>
      {capitalize(priority)}
    </span>
  )
}

const SEVERITY_CONFIG: Record<RiskSeverity, { className: string }> = {
  critical: { className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  high: { className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  medium: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  low: { className: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
}

function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  const cfg = SEVERITY_CONFIG[severity]
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cfg.className}`}>
      {capitalize(severity)}
    </span>
  )
}

function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  if (confidence === 'high') return null
  return (
    <span className={`text-[11px] font-medium ${
      confidence === 'medium'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-orange-600 dark:text-orange-400'
    }`}>
      {confidence === 'medium' ? '~ Inferred' : '~ Estimated'}
    </span>
  )
}

const INSIGHT_CONFIG: Record<InsightType, { icon: LucideIcon; className: string; label: string }> = {
  'missing-owner': { icon: UserX, className: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300', label: 'Missing Owner' },
  'missing-deadline': { icon: Clock, className: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300', label: 'Missing Deadline' },
  'repeated-concern': { icon: RefreshCw, className: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-300', label: 'Repeated Concern' },
  'project-risk': { icon: ShieldAlert, className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300', label: 'Project Risk' },
  'unresolved-item': { icon: CircleEllipsis, className: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300', label: 'Unresolved Item' },
  'follow-up-needed': { icon: ArrowRight, className: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300', label: 'Follow-up Needed' },
  'discussion-distribution': { icon: BarChart2, className: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-300', label: 'Distribution' },
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  count,
  children,
  accent,
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
    <section
      className={`rounded-xl border bg-card shadow-sm overflow-hidden ${accent ? `border-l-4 ${accent}` : 'border-border'}`}
    >
      <div
        className={`flex items-center gap-2.5 px-6 py-4 bg-muted/20 ${open ? 'border-b border-border/60' : ''} ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? open : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={collapsible ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v) } } : undefined}
      >
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count !== undefined && (
          <span className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary ${collapsible ? '' : 'ml-auto'}`}>
            {count}
          </span>
        )}
        {collapsible && (
          <ChevronDown
            className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          />
        )}
      </div>
      {open && <div className="px-6 py-5">{children}</div>}
    </section>
  )
}

// ─── Executive Summary ────────────────────────────────────────────────────────

function ExecutiveSummaryCard({ summary }: { summary: MeetingAnalysis['executiveSummary'] }) {
  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10">
        <div className="flex items-center gap-2.5">
          <Target className="h-4 w-4 text-primary shrink-0" />
          <h2 className="text-sm font-semibold text-foreground">Executive Summary</h2>
        </div>
        <OverallStatusBadge status={summary.status} />
      </div>
      <div className="px-6 py-5 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Objective</p>
            <p className="text-sm text-foreground leading-relaxed">{summary.objective}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Key Outcome</p>
            <p className="text-sm text-foreground leading-relaxed">{summary.keyOutcome}</p>
          </div>
        </div>
        <Separator className="opacity-40" />
        <p className="text-sm text-foreground/90 leading-relaxed">{summary.paragraph}</p>
      </div>
    </section>
  )
}

// ─── Discussion Topics ────────────────────────────────────────────────────────

function DiscussionTopicsSection({ topics }: { topics: MeetingAnalysis['discussionTopics'] }) {
  return (
    <SectionCard icon={MessageSquare} title="Discussion Topics" count={topics.length}>
      <div className="space-y-5">
        {topics.map((topic, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="space-y-2"
          >
            <h3 className="text-sm font-semibold text-foreground">{topic.topic}</h3>
            <ul className="space-y-1.5">
              {topic.points.map((point, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-foreground/85">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
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
        <p className="text-sm text-muted-foreground italic">No action items extracted.</p>
      ) : (
        <div className="space-y-3">
          {pending > 0 && done > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.round((done / aiItems.length) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{done}/{aiItems.length} done</span>
            </div>
          )}
          {aiItems.map((item, i) => {
            const dbItem = dbItems[i]
            const completed = dbItem?.completed ?? false
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                  completed
                    ? 'bg-muted/30 border-border/40'
                    : 'bg-card border-border hover:border-border/80'
                }`}
              >
                <button
                  aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
                  onClick={() => dbItem && onToggle(dbItem.id, !completed)}
                  disabled={!dbItem}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 ${
                    completed
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/60'
                  }`}
                >
                  {completed && <Check className="h-3 w-3" />}
                </button>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p
                    className={`text-sm leading-snug ${
                      completed ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {item.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={item.priority} />
                    {item.assignee && (
                      <span className="text-xs text-muted-foreground">→ {item.assignee}</span>
                    )}
                    {item.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatShortDate(item.dueDate)}
                      </span>
                    )}
                    <ConfidenceIndicator confidence={item.confidence} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Decisions (premium) ──────────────────────────────────────────────────────

function PremiumDecisionsSection({ decisions }: { decisions: DecisionAI[] }) {
  return (
    <SectionCard icon={Lightbulb} title="Decisions" count={decisions.length} accent="border-l-emerald-400">
      <div className="space-y-4">
        {decisions.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground leading-snug">{d.content}</p>
              <ConfidenceIndicator confidence={d.confidence} />
            </div>
            {d.context && (
              <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-border">
                {d.context}
              </p>
            )}
            {d.impact && (
              <div className="flex items-start gap-2 pt-1">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                <p className="text-xs text-primary/80 leading-relaxed">{d.impact}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </SectionCard>
  )
}

// ─── Risks & Blockers (premium) ───────────────────────────────────────────────

const RISK_SEVERITY_BORDER: Record<RiskSeverity, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-amber-400',
  low: 'border-l-blue-400',
}

const LIKELIHOOD_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

function PremiumRisksSection({ risks }: { risks: RiskAI[] }) {
  return (
    <SectionCard icon={AlertTriangle} title="Risks & Blockers" count={risks.length} accent="border-l-orange-400">
      <div className="space-y-4">
        {risks.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-lg border border-l-4 bg-card p-4 space-y-3 ${RISK_SEVERITY_BORDER[r.severity]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground leading-snug">{r.content}</p>
              <SeverityBadge severity={r.severity} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {r.impact && (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Impact</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{r.impact}</p>
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Likelihood</p>
                <p className="text-xs text-foreground/80">{LIKELIHOOD_LABEL[r.likelihood]}</p>
              </div>
            </div>
            {r.mitigation && (
              <div className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Mitigation</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{r.mitigation}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </SectionCard>
  )
}

// ─── Open Questions ───────────────────────────────────────────────────────────

function OpenQuestionsSection({ questions }: { questions: string[] }) {
  return (
    <SectionCard icon={HelpCircle} title="Open Questions" count={questions.length}>
      <ol className="space-y-2.5">
        {questions.map((q, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-3 text-sm text-foreground"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {i + 1}
            </span>
            {q}
          </motion.li>
        ))}
      </ol>
    </SectionCard>
  )
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

function AIInsightsSection({ insights }: { insights: MeetingAnalysis['aiInsights'] }) {
  return (
    <SectionCard icon={Sparkles} title="AI Insights" count={insights.length} accent="border-l-violet-400">
      <div className="space-y-2.5">
        {insights.map((insight, i) => {
          const cfg = INSIGHT_CONFIG[insight.type]
          const Icon = cfg.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${cfg.className}`}
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{insight.content}</p>
            </motion.div>
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
      <div className="relative pl-6 space-y-0">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
        {timeline.map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative pb-5 last:pb-0"
          >
            <span className="absolute -left-4 top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary/70 ring-2 ring-primary/20" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-primary">{event.moment}</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{event.description}</p>
            </div>
          </motion.div>
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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Completed', value: completed, color: 'text-emerald-600' },
          { label: 'In Progress', value: inProgress, color: 'text-amber-600' },
          { label: 'Pending', value: pending, color: 'text-muted-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-border/60 bg-muted/20 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
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
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {open ? 'Hide transcript' : 'Show transcript'}
      </button>
      {open && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-5 overflow-x-auto">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/70">
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
  const toggle = useToggleActionItem(meetingId)
  const update = useUpdateMeeting(meetingId)
  const { exportPDF, isExporting } = useExportPDF()

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
              {meeting.participants && meeting.participants.length > 0 && (
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex flex-wrap gap-1.5">
                    {meeting.participants.map((name) => (
                      <Badge key={name} variant="secondary" className="text-xs font-normal">
                        {name}
                      </Badge>
                    ))}
                  </span>
                </span>
              )}
              {aiAnalysis && (
                <OverallStatusBadge status={aiAnalysis.executiveSummary.status} />
              )}
            </div>
          </div>

          {/* Premium layout (when ai_analysis exists) */}
          {aiAnalysis ? (
            <div className="space-y-6">
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
