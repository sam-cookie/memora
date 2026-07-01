import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare,
  Check,
  ArrowRight,
  Search,
  ChevronRight,
  ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { useAllActionItems, useToggleActionItem } from '../hooks/useActionItems'
import type { ActionItemPriority } from '@/types/database'
import type { ActionItemWithMeeting } from '../services/actionItems.service'

// ─── Constants ────────────────────────────────────────────────────────────────

type Filter = 'all' | 'open' | 'completed'

const PRIORITY_VARIANT: Record<
  ActionItemPriority,
  'secondary' | 'warning' | 'destructive' | 'default'
> = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
}

const PRIORITY_ORDER: Record<ActionItemPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} className="space-y-2">
            <Skeleton className="h-4 w-48" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Action Item Row ──────────────────────────────────────────────────────────

interface ActionItemRowProps {
  item: ActionItemWithMeeting
  index: number
}

function ActionItemRow({ item, index }: ActionItemRowProps) {
  const toggle = useToggleActionItem()

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="flex items-start gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm"
    >
      <button
        type="button"
        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
        onClick={() => toggle.mutate({ id: item.id, completed: !item.completed })}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          item.completed
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border hover:border-primary/60',
        )}
      >
        {item.completed && <Check className="h-3 w-3" />}
      </button>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p
          className={cn(
            'text-sm leading-snug',
            item.completed ? 'line-through text-muted-foreground' : 'text-foreground',
          )}
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
          {item.due_date && (
            <span className="text-xs text-muted-foreground">
              Due{' '}
              {new Date(item.due_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </motion.li>
  )
}

// ─── Meeting Group ────────────────────────────────────────────────────────────

interface MeetingGroupProps {
  meetingId: string
  meetingTitle: string
  items: ActionItemWithMeeting[]
  globalIndex: number
}

function MeetingGroup({ meetingId, meetingTitle, items, globalIndex }: MeetingGroupProps) {
  const completedCount = items.filter((i) => i.completed).length

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: globalIndex * 0.05 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          to={ROUTES.meeting(meetingId)}
          className="group flex items-center gap-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
            {meetingTitle}
          </h2>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
        </Link>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{items.length} done
        </span>
      </div>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <ActionItemRow key={item.id} item={item} index={i} />
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ActionItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filterParam = searchParams.get('filter') as Filter | null
  const [activeFilter, setActiveFilter] = useState<Filter>(
    filterParam === 'open' || filterParam === 'completed' ? filterParam : 'all',
  )
  const [search, setSearch] = useState('')

  const { data = [], isLoading, isError } = useAllActionItems()

  function setFilter(f: Filter) {
    setActiveFilter(f)
    if (f === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ filter: f })
    }
  }

  // Stats
  const total = data.length
  const open = data.filter((i) => !i.completed).length
  const completed = data.filter((i) => i.completed).length

  // Filter + search
  const filtered = data
    .filter((item) => {
      if (activeFilter === 'open') return !item.completed
      if (activeFilter === 'completed') return item.completed
      return true
    })
    .filter((item) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        item.content.toLowerCase().includes(q) ||
        item.meetings?.title.toLowerCase().includes(q) ||
        item.assignee?.toLowerCase().includes(q)
      )
    })

  // Group by meeting, sort items within each group by priority
  const grouped = filtered.reduce<
    Record<string, { meetingId: string; meetingTitle: string; items: ActionItemWithMeeting[] }>
  >((acc, item) => {
    const meetingId = item.meetings?.id ?? item.meeting_id
    const meetingTitle = item.meetings?.title ?? 'Unknown meeting'
    if (!acc[meetingId]) acc[meetingId] = { meetingId, meetingTitle, items: [] }
    acc[meetingId].items.push(item)
    return acc
  }, {})

  const groups = Object.values(grouped).map((g) => ({
    ...g,
    items: [...g.items].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
  }))

  const filterTabs: { label: string; value: Filter; count: number }[] = [
    { label: 'All', value: 'all', count: total },
    { label: 'Open', value: 'open', count: open },
    { label: 'Completed', value: 'completed', count: completed },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Action Items"
        description="Track tasks extracted from your meetings"
        icon={CheckSquare}
        actions={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{open}</span> open
            </span>
            <span>
              <span className="font-semibold text-foreground">{completed}</span> completed
            </span>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-5">
        {/* Filter + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-1 p-1 w-fit">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  activeFilter === tab.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    activeFilter === tab.value
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-2 text-muted-foreground',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-xs w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search action items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search action items"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && <PageSkeleton />}

        {/* Error */}
        {isError && (
          <EmptyState
            icon={CheckSquare}
            title="Failed to load action items"
            description="Something went wrong. Please refresh the page."
          />
        )}

        {/* Empty — no data at all */}
        {!isLoading && !isError && total === 0 && (
          <EmptyState
            icon={ListChecks}
            title="No action items yet"
            description="Action items are automatically extracted when a meeting is processed."
            action={{
              label: 'Upload a meeting',
              onClick: () => {},
            }}
          />
        )}

        {/* Empty — filters produced no results */}
        {!isLoading && !isError && total > 0 && groups.length === 0 && (
          <EmptyState
            icon={Search}
            title="No matches"
            description={
              search
                ? `No action items found matching "${search}".`
                : `No ${activeFilter} action items.`
            }
          />
        )}

        {/* Results */}
        {!isLoading && !isError && groups.length > 0 && (
          <div className="space-y-8">
            {groups.map((group, i) => (
              <MeetingGroup
                key={group.meetingId}
                meetingId={group.meetingId}
                meetingTitle={group.meetingTitle}
                items={group.items}
                globalIndex={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
