import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  Mic,
  CheckCircle2,
  ListChecks,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/config/routes'
import { useDashboardStats, useRecentMeetings } from '../hooks/useDashboard'
import type { Meeting } from '@/types/database'

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: number
  label: string
  sub: string
  pulse?: boolean
  index: number
  isLoading: boolean
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  sub,
  pulse,
  index,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="p-5 space-y-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="p-5 space-y-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {value.toLocaleString()}
            </p>
            {pulse && value > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground/60">{sub}</p>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Meeting Row ──────────────────────────────────────────────────────────────

function MeetingRow({ meeting, index }: { meeting: Meeting; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={ROUTES.meeting(meeting.id)} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        <div className="flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-surface-2 transition-colors group">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(meeting.created_at)}</p>
          </div>
          <StatusBadge status={meeting.status} />
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    </motion.div>
  )
}

function MeetingRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-3 py-2.5">
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentMeetings, isLoading: meetingsLoading } = useRecentMeetings()

  const firstName =
    (user?.user_metadata?.['full_name'] as string | undefined)?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'there'

  const statCards: Omit<StatCardProps, 'index' | 'isLoading'>[] = [
    {
      icon: Mic,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      value: stats?.totalMeetings ?? 0,
      label: 'Total Meetings',
      sub: stats?.processingMeetings
        ? `${stats.processingMeetings} processing now`
        : 'Uploaded recordings',
      pulse: (stats?.processingMeetings ?? 0) > 0,
    },
    {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      value: stats?.completedMeetings ?? 0,
      label: 'Completed',
      sub: 'Successfully analyzed',
    },
    {
      icon: ListChecks,
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-500',
      value: stats?.totalActionItems ?? 0,
      label: 'Action Items',
      sub: 'Extracted across meetings',
    },
    {
      icon: Clock,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      value: stats?.openActionItems ?? 0,
      label: 'Open Tasks',
      sub: stats?.openActionItems === 0 ? 'All caught up!' : 'Need attention',
    },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{todayLabel()}</p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link to={ROUTES.meetingNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Meeting
          </Link>
        </Button>
      </motion.div>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} index={i} isLoading={statsLoading} />
          ))}
        </div>
      </section>

      {/* Recent Meetings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent Meetings</h2>
          <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
            <Link to={ROUTES.meetings}>
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>

        <Card className="divide-y divide-border/50 overflow-hidden">
          {meetingsLoading && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <MeetingRowSkeleton key={i} />
              ))}
            </>
          )}

          {!meetingsLoading && recentMeetings?.length === 0 && (
            <EmptyState
              icon={Mic}
              title="No meetings yet"
              description="Upload your first recording to get started."
              action={{ label: 'Upload a meeting', onClick: () => {} }}
              className="py-10"
            />
          )}

          {!meetingsLoading && recentMeetings && recentMeetings.length > 0 && (
            <div className="p-2">
              {recentMeetings.map((meeting, i) => (
                <MeetingRow key={meeting.id} meeting={meeting} index={i} />
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}
