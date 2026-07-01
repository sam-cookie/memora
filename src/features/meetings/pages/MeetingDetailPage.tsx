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
  List,
  Loader2,
  Pencil,
  Trash2,
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

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_VARIANT: Record<ActionItemPriority, 'secondary' | 'warning' | 'destructive' | 'default'> = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
}

const SEVERITY_VARIANT: Record<RiskSeverity, 'secondary' | 'warning' | 'destructive' | 'default'> = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
}

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

// ─── Export ───────────────────────────────────────────────────────────────────

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

  if (meeting.summary) {
    lines.push('## Summary', '', meeting.summary, '')
  }

  if (meeting.key_points?.length) {
    lines.push('## Key Points', '')
    meeting.key_points.forEach((p) => lines.push(`- ${p}`))
    lines.push('')
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
    lines.push('## Follow-up Questions', '')
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

// ─── Doc Section ──────────────────────────────────────────────────────────────

function DocSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h2>
      {children}
    </section>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function DocumentSkeleton() {
  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-12 space-y-10">
      <div className="space-y-4">
        <Skeleton className="h-9 w-3/4" />
        <div className="flex gap-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
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

// ─── Processing view ──────────────────────────────────────────────────────────

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

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <ToolbarSkeleton />
        <DocumentSkeleton />
      </div>
    )
  }

  // ── Not found / error ────────────────────────────────────────────────────

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

  return (
    <div className="flex flex-col min-h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 print:hidden">
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
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-3xl mx-auto w-full px-8 py-12 space-y-10"
        >
          {/* Title */}
          <EditableTitle
            value={meeting.title}
            onSave={(title) => update.mutate({ title })}
            disabled={update.isPending}
          />

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(displayDate)}
            </span>
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
          </div>

          <Separator />

          {/* Summary */}
          {meeting.summary && (
            <DocSection icon={FileText} title="Summary">
              <p className="text-sm leading-relaxed text-foreground/90">{meeting.summary}</p>
            </DocSection>
          )}

          {/* Key Points */}
          {meeting.key_points && meeting.key_points.length > 0 && (
            <DocSection icon={List} title="Key Points">
              <ul className="space-y-2">
                {meeting.key_points.map((point, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-2.5 text-sm text-foreground/90"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {point}
                  </motion.li>
                ))}
              </ul>
            </DocSection>
          )}

          {/* Action Items */}
          <DocSection icon={CheckSquare} title="Action Items">
            {actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No action items extracted.</p>
            ) : (
              <ul className="space-y-3">
                {actionItems.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3"
                  >
                    <button
                      aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                      onClick={() => toggle.mutate({ id: item.id, completed: !item.completed })}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        item.completed
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/60'
                      }`}
                    >
                      {item.completed && <Check className="h-3 w-3" />}
                    </button>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p
                        className={`text-sm leading-snug ${
                          item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
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
                  </motion.li>
                ))}
              </ul>
            )}
          </DocSection>

          {/* Decisions */}
          {decisions.length > 0 && (
            <DocSection icon={Lightbulb} title="Decisions">
              <ul className="space-y-3">
                {decisions.map((d, i) => (
                  <motion.li
                    key={d.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="space-y-1"
                  >
                    <p className="text-sm font-medium text-foreground">{d.content}</p>
                    {d.context && (
                      <p className="text-xs text-muted-foreground pl-3 border-l-2 border-border/60 leading-relaxed">
                        {d.context}
                      </p>
                    )}
                  </motion.li>
                ))}
              </ul>
            </DocSection>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <DocSection icon={AlertTriangle} title="Risks & Blockers">
              <ul className="space-y-2">
                {risks.map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <Badge
                      variant={SEVERITY_VARIANT[r.severity]}
                      className="mt-0.5 shrink-0 text-xs"
                    >
                      {capitalize(r.severity)}
                    </Badge>
                    {r.content}
                  </motion.li>
                ))}
              </ul>
            </DocSection>
          )}

          {/* Follow-up Questions */}
          {questions.length > 0 && (
            <DocSection icon={HelpCircle} title="Follow-up Questions">
              <ol className="space-y-2">
                {questions.map((q, i) => (
                  <motion.li
                    key={q.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    {q.question}
                  </motion.li>
                ))}
              </ol>
            </DocSection>
          )}

          {/* Transcript */}
          {meeting.transcript && (
            <DocSection icon={AlignLeft} title="Transcript">
              <div className="rounded-lg border border-border bg-card/50 p-5 overflow-x-auto">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/80">
                  {meeting.transcript}
                </pre>
              </div>
            </DocSection>
          )}
        </motion.article>
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
