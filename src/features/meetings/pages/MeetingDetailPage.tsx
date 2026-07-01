import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  ArrowLeft,
  CheckSquare,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  AlignLeft,
  Users,
  Calendar,
  Check,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ROUTES } from '@/config/routes'
import {
  useMeeting,
  useActionItems,
  useDecisions,
  useRisks,
  useFollowUpQuestions,
  useToggleActionItem,
} from '../hooks/useMeetingDetail'
import type { ActionItemPriority, RiskSeverity } from '@/types/database'

// ─── Priority / Severity badge helpers ────────────────────────────────────────

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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ summary, participants }: { summary: string | null; participants: string[] | null }) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</h2>
        {summary ? (
          <p className="text-sm leading-relaxed text-foreground">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No summary available.</p>
        )}
      </section>

      {participants && participants.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Participants
          </h2>
          <div className="flex flex-wrap gap-2">
            {participants.map((name) => (
              <Badge key={name} variant="secondary">
                {name}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Action Items tab ─────────────────────────────────────────────────────────

function ActionItemsTab({ meetingId }: { meetingId: string }) {
  const { data: items, isLoading } = useActionItems(meetingId, true)
  const toggle = useToggleActionItem(meetingId)

  if (isLoading) return <DetailSkeleton />

  if (!items?.length) {
    return <EmptyState icon={CheckSquare} title="No action items" description="No action items were extracted from this meeting." />
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
        >
          <button
            aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
            onClick={() => toggle.mutate({ id: item.id, completed: !item.completed })}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              item.completed
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/60'
            }`}
          >
            {item.completed && <Check className="h-3 w-3" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {item.content}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge variant={PRIORITY_VARIANT[item.priority]}>{capitalize(item.priority)}</Badge>
              {item.assignee && (
                <span className="text-xs text-muted-foreground">→ {item.assignee}</span>
              )}
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  )
}

// ─── Decisions tab ────────────────────────────────────────────────────────────

function DecisionsTab({ meetingId }: { meetingId: string }) {
  const { data: decisions, isLoading } = useDecisions(meetingId, true)

  if (isLoading) return <DetailSkeleton />

  if (!decisions?.length) {
    return <EmptyState icon={Lightbulb} title="No decisions" description="No decisions were recorded in this meeting." />
  }

  return (
    <ul className="space-y-2">
      {decisions.map((d) => (
        <motion.li
          key={d.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border bg-card p-4 space-y-1"
        >
          <p className="text-sm font-medium text-foreground">{d.content}</p>
          {d.context && <p className="text-xs text-muted-foreground">{d.context}</p>}
        </motion.li>
      ))}
    </ul>
  )
}

// ─── Risks tab ────────────────────────────────────────────────────────────────

function RisksTab({ meetingId }: { meetingId: string }) {
  const { data: risks, isLoading } = useRisks(meetingId, true)

  if (isLoading) return <DetailSkeleton />

  if (!risks?.length) {
    return <EmptyState icon={AlertTriangle} title="No risks" description="No risks or blockers were identified." />
  }

  return (
    <ul className="space-y-2">
      {risks.map((r) => (
        <motion.li
          key={r.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
        >
          <Badge variant={SEVERITY_VARIANT[r.severity]} className="mt-0.5 shrink-0">
            {capitalize(r.severity)}
          </Badge>
          <p className="text-sm text-foreground">{r.content}</p>
        </motion.li>
      ))}
    </ul>
  )
}

// ─── Follow-up tab ────────────────────────────────────────────────────────────

function FollowUpTab({ meetingId }: { meetingId: string }) {
  const { data: questions, isLoading } = useFollowUpQuestions(meetingId, true)

  if (isLoading) return <DetailSkeleton />

  if (!questions?.length) {
    return <EmptyState icon={HelpCircle} title="No follow-up questions" description="No open questions were identified." />
  }

  return (
    <ul className="space-y-2">
      {questions.map((q, i) => (
        <motion.li
          key={q.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {i + 1}
          </span>
          <p className="text-sm text-foreground">{q.question}</p>
        </motion.li>
      ))}
    </ul>
  )
}

// ─── Transcript tab ───────────────────────────────────────────────────────────

function TranscriptTab({ transcript }: { transcript: string | null }) {
  if (!transcript) {
    return <EmptyState icon={AlignLeft} title="No transcript" description="The transcript is not available for this meeting." />
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
        {transcript}
      </pre>
    </div>
  )
}

// ─── Processing state ─────────────────────────────────────────────────────────

function ProcessingState({ status }: { status: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <StatusBadge status={status as never} />
      <p className="text-sm text-muted-foreground">
        Your meeting is being processed. This page will update automatically.
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: meeting, isLoading, isError } = useMeeting(id ?? '')

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="px-6 py-5 border-b border-border/50 space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <DetailSkeleton />
      </div>
    )
  }

  if (isError || !meeting) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader title="Meeting not found" icon={FileText} />
        <EmptyState
          icon={FileText}
          title="Meeting not found"
          description="This meeting doesn't exist or you don't have access to it."
          className="flex-1"
        />
      </div>
    )
  }

  const isCompleted = meeting.status === 'completed'
  const isProcessing = ['pending', 'uploading', 'transcribing', 'analyzing'].includes(meeting.status)

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title={meeting.title}
        icon={FileText}
        description={meeting.processed_at ? formatDate(meeting.processed_at) : undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={meeting.status} />
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.meetings}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        {isProcessing && <ProcessingState status={meeting.status} />}

        {isCompleted && (
          <Tabs defaultValue="overview" className="space-y-5">
            <TabsList>
              <TabsTrigger value="overview">
                <FileText className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="action-items">
                <CheckSquare className="h-3.5 w-3.5" /> Action Items
              </TabsTrigger>
              <TabsTrigger value="decisions">
                <Lightbulb className="h-3.5 w-3.5" /> Decisions
              </TabsTrigger>
              <TabsTrigger value="risks">
                <AlertTriangle className="h-3.5 w-3.5" /> Risks
              </TabsTrigger>
              <TabsTrigger value="follow-up">
                <HelpCircle className="h-3.5 w-3.5" /> Follow-up
              </TabsTrigger>
              <TabsTrigger value="transcript">
                <AlignLeft className="h-3.5 w-3.5" /> Transcript
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab summary={meeting.summary} participants={meeting.participants} />
            </TabsContent>
            <TabsContent value="action-items">
              <ActionItemsTab meetingId={meeting.id} />
            </TabsContent>
            <TabsContent value="decisions">
              <DecisionsTab meetingId={meeting.id} />
            </TabsContent>
            <TabsContent value="risks">
              <RisksTab meetingId={meeting.id} />
            </TabsContent>
            <TabsContent value="follow-up">
              <FollowUpTab meetingId={meeting.id} />
            </TabsContent>
            <TabsContent value="transcript">
              <TranscriptTab transcript={meeting.transcript} />
            </TabsContent>
          </Tabs>
        )}

        {meeting.status === 'failed' && (
          <EmptyState
            icon={FileText}
            title="Processing failed"
            description="Something went wrong while processing this meeting."
            action={{ label: 'Upload another', onClick: () => history.back() }}
          />
        )}
      </div>
    </div>
  )
}
