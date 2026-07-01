import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mic,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { EditMeetingDialog } from '@/features/meetings/components/EditMeetingDialog'
import { DeleteMeetingDialog } from '@/features/meetings/components/DeleteMeetingDialog'
import { useToggleActionItem } from '@/features/action-items/hooks/useActionItems'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/config/routes'
import { useDashboardStats, useRecentMeetings, useOpenActionItems } from '../hooks/useDashboard'
import type { Meeting, ActionItemPriority } from '@/types/database'
import type { ActionItemWithMeeting } from '../services/dashboard.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const PRIORITY_VARIANT: Record<ActionItemPriority, 'secondary' | 'warning' | 'destructive' | 'default'> = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType
  value: number | undefined
  label: string
  sub: string
  accentClass: string
  pulse?: boolean
  isLoading: boolean
  index: number
  onClick?: () => void
}

function StatCard({ icon: Icon, value, label, sub, accentClass, pulse, isLoading, index, onClick }: StatCardProps) {
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Wrapper
        {...(onClick ? { type: 'button' as const, onClick } : {})}
        className={cn(
          'group w-full text-left',
          onClick && 'cursor-pointer',
        )}
      >
        <Card className={cn(
          'relative overflow-hidden p-6 transition-all duration-200',
          onClick && 'hover:shadow-md hover:-translate-y-0.5 hover:border-border/80',
        )}>
          {/* Subtle accent strip on top */}
          <div className={cn('absolute inset-x-0 top-0 h-0.5', accentClass)} />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', accentClass.replace('bg-', 'bg-').replace(/\/\d+$/, '/10'))}>
                <Icon className={cn('h-4 w-4', accentClass.includes('emerald') ? 'text-emerald-600' : accentClass.includes('amber') ? 'text-amber-600' : 'text-primary')} />
              </div>
              {onClick && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              )}
            </div>

            <div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      {(value ?? 0).toLocaleString()}
                    </span>
                    {pulse && (value ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        live
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground/80">{label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
                </>
              )}
            </div>
          </div>
        </Card>
      </Wrapper>
    </motion.div>
  )
}

// ─── Meeting Row ──────────────────────────────────────────────────────────────

function MeetingRow({ meeting, index }: { meeting: Meeting; index: number }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <motion.div
        className="group"
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.06, duration: 0.25 }}
      >
        <div className="flex items-center gap-4 rounded-lg px-3 py-3 hover:bg-slate-50 transition-colors">
          <Link
            to={ROUTES.meeting(meeting.id)}
            className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <p className="text-sm font-medium text-foreground truncate leading-snug">
              {meeting.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(meeting.created_at)}</p>
          </Link>
          <StatusBadge status={meeting.status} />
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-slate-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
              aria-label="Meeting options"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <EditMeetingDialog meeting={meeting} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteMeetingDialog
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate(ROUTES.meetings)}
      />
    </>
  )
}

function MeetingRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-3 py-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  )
}

// ─── Open Task Row ─────────────────────────────────────────────────────────────

function OpenTaskRow({ item, index }: { item: ActionItemWithMeeting; index: number }) {
  const toggle = useToggleActionItem()

  return (
    <motion.div
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="flex items-start gap-3 py-3"
    >
      <button
        type="button"
        aria-label="Mark complete"
        onClick={() => toggle.mutate({ id: item.id, completed: true })}
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border hover:border-primary/60 hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Check className="h-2.5 w-2.5 text-transparent group-hover:text-primary/40" />
      </button>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm text-foreground leading-snug line-clamp-2">{item.content}</p>
        <div className="flex flex-wrap items-center gap-2">
          {item.meetings && (
            <Link
              to={ROUTES.meeting(item.meetings.id)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline truncate max-w-[140px]"
            >
              {item.meetings.title}
            </Link>
          )}
          <Badge variant={PRIORITY_VARIANT[item.priority]} className="text-[10px] px-1.5 py-0">
            {capitalize(item.priority)}
          </Badge>
        </div>
      </div>
    </motion.div>
  )
}

function OpenTaskSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="mt-0.5 h-4 w-4 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentMeetings, isLoading: meetingsLoading } = useRecentMeetings()
  const { data: openTasks = [], isLoading: tasksLoading } = useOpenActionItems()

  const firstName =
    (user?.user_metadata?.['full_name'] as string | undefined)?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'there'

  const statCards: Omit<StatCardProps, 'index' | 'isLoading'>[] = [
    {
      icon: Mic,
      accentClass: 'bg-primary',
      value: stats?.totalMeetings,
      label: 'Total Meetings',
      sub: stats?.processingMeetings ? `${stats.processingMeetings} processing` : 'Across all time',
      pulse: (stats?.processingMeetings ?? 0) > 0,
      onClick: () => navigate(ROUTES.meetings),
    },
    {
      icon: CheckCircle2,
      accentClass: 'bg-emerald-500',
      value: stats?.completedMeetings,
      label: 'Completed',
      sub: 'Successfully analyzed',
    },
    {
      icon: Clock,
      accentClass: 'bg-amber-500',
      value: stats?.openActionItems,
      label: 'Open Tasks',
      sub: stats?.openActionItems === 0 ? 'All caught up!' : 'Awaiting completion',
      onClick: () => navigate(`${ROUTES.actionItems}?filter=open`),
    },
  ]

  const previewTasks = openTasks.slice(0, 6)

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-6xl px-8 py-10 space-y-10">

        {/* ── Greeting ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {greeting()}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{todayLabel()}</p>
          </div>
          <Button asChild size="sm" className="shrink-0 mb-1">
            <Link to={ROUTES.meetingNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Meeting
            </Link>
          </Button>
        </motion.div>

        {/* ── Stats row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} index={i} isLoading={statsLoading} />
          ))}
        </div>

        {/* ── Two-column body ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">

          {/* Recent Meetings */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Recent Meetings</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your five most recent recordings</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                <Link to={ROUTES.meetings}>
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            <Card className="overflow-hidden">
              {meetingsLoading ? (
                <div className="divide-y divide-border/40 px-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <MeetingRowSkeleton key={i} />
                  ))}
                </div>
              ) : !recentMeetings?.length ? (
                <EmptyState
                  icon={Mic}
                  title="No meetings yet"
                  description="Upload a recording to get started."
                  action={{ label: 'Upload your first meeting', onClick: () => navigate(ROUTES.meetingNew) }}
                  className="py-12"
                />
              ) : (
                <div className="divide-y divide-border/40 px-2">
                  {recentMeetings.map((meeting, i) => (
                    <MeetingRow key={meeting.id} meeting={meeting} index={i} />
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* Open Tasks */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Open Tasks</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tasksLoading ? 'Loading…' : `${openTasks.length} item${openTasks.length !== 1 ? 's' : ''} remaining`}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                <Link to={`${ROUTES.actionItems}?filter=open`}>
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            <Card className="px-4 py-2">
              {tasksLoading ? (
                <div className="divide-y divide-border/40">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <OpenTaskSkeleton key={i} />
                  ))}
                </div>
              ) : openTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">No open tasks right now.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border/40">
                    {previewTasks.map((item, i) => (
                      <OpenTaskRow key={item.id} item={item} index={i} />
                    ))}
                  </div>
                  {openTasks.length > 6 && (
                    <>
                      <Separator className="my-1" />
                      <div className="py-2 text-center">
                        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground gap-1.5">
                          <Link to={`${ROUTES.actionItems}?filter=open`}>
                            <ListChecks className="h-3.5 w-3.5" />
                            {openTasks.length - 6} more task{openTasks.length - 6 !== 1 ? 's' : ''}
                          </Link>
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
