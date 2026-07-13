import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Clock,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { useMeetings } from '@/features/meetings/hooks/useMeetings'
import type { Meeting } from '@/types/database'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}


// ─── Calendar grid builder ────────────────────────────────────────────────────

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date()
  const firstOfMonth = new Date(year, month, 1)
  const startPad = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: CalendarDay[] = []

  for (let i = startPad - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({ date, isCurrentMonth: false, isToday: sameDay(date, today) })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    days.push({ date, isCurrentMonth: true, isToday: sameDay(date, today) })
  }
  const remainder = days.length % 7
  if (remainder !== 0) {
    for (let i = 1; i <= 7 - remainder; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false, isToday: sameDay(date, today) })
    }
  }

  return days
}

// ─── Status chip color ────────────────────────────────────────────────────────

function meetingChipClass(status: Meeting['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'failed':
      return 'bg-red-50 text-red-600 border-red-100'
    case 'analyzing':
    case 'transcribing':
      return 'bg-sky-50 text-sky-700 border-sky-100'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

function DayDetailPanel({
  day,
  meetings,
  onClose,
}: {
  day: Date
  meetings: Meeting[]
  onClose: () => void
}) {
  return (
    <motion.aside
      key={day.toDateString()}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="w-80 shrink-0 border-l border-border/50 flex flex-col bg-background"
    >
      {/* Panel header */}
      <div className="flex items-start justify-between gap-2 px-5 py-4 border-b border-border/50">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {day.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-2xl font-bold text-foreground leading-tight mt-0.5">
            {day.getDate()}
          </p>
          <p className="text-sm text-muted-foreground">
            {day.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Meeting count */}
      <div className="px-5 py-3 border-b border-border/50">
        <p className="text-xs text-muted-foreground">
          {meetings.length === 0
            ? 'No meetings'
            : `${meetings.length} meeting${meetings.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Meetings list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="h-10 w-10 rounded-full bg-surface-2 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              No meetings scheduled for this day.
            </p>
          </div>
        ) : (
          meetings.map((meeting, i) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={ROUTES.meeting(meeting.id)}
                className="block rounded-xl border border-border/60 bg-card p-4 space-y-2.5 hover:border-primary/30 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 flex-1">
                    {meeting.title}
                  </p>
                  <StatusBadge status={meeting.status} />
                </div>

                {meeting.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {meeting.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatTime(meeting.meeting_date ?? meeting.created_at)}
                  </span>
                  {meeting.participants && meeting.participants.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 shrink-0" />
                      {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </motion.aside>
  )
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

const MAX_CHIPS = 3

function DayCell({
  day,
  meetings,
  isSelected,
  onClick,
}: {
  day: CalendarDay
  meetings: Meeting[]
  isSelected: boolean
  onClick: () => void
}) {
  const overflow = meetings.length - MAX_CHIPS
  const visible = meetings.slice(0, MAX_CHIPS)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${day.date.toDateString()}${meetings.length ? `, ${meetings.length} meeting${meetings.length !== 1 ? 's' : ''}` : ''}`}
      aria-pressed={isSelected}
      className={cn(
        'group relative flex flex-col gap-1 rounded-xl border p-2 text-left transition-all min-h-[90px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !day.isCurrentMonth && 'opacity-40',
        isSelected
          ? 'border-primary/40 bg-primary/5 shadow-sm'
          : day.isToday
          ? 'border-primary/30 bg-primary/[0.03]'
          : 'border-transparent hover:border-border hover:bg-surface-1',
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium self-end',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : day.isToday
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-foreground group-hover:bg-surface-2',
        )}
      >
        {day.date.getDate()}
      </span>

      {/* Meeting chips */}
      <div className="w-full space-y-0.5 min-w-0">
        {visible.map((meeting) => (
          <div
            key={meeting.id}
            className={cn(
              'truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight border',
              meetingChipClass(meeting.status),
            )}
          >
            {meeting.title}
          </div>
        ))}
        {overflow > 0 && (
          <div className="px-1 text-[10px] text-muted-foreground font-medium">
            +{overflow} more
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Calendar Skeleton ────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(today)

  const { data: meetings = [], isLoading } = useMeetings()

  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {}
    for (const m of meetings) {
      const key = toDateKey(m.meeting_date ?? m.created_at)
      if (!map[key]) map[key] = []
      map[key].push(m)
    }
    return map
  }, [meetings])

  const calendarDays = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  function goToToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelectedDay(today)
  }

  const selectedKey = selectedDay ? toDateKey(selectedDay.toISOString()) : null
  const selectedMeetings = selectedKey ? (meetingsByDate[selectedKey] ?? []) : []

  const totalThisMonth = calendarDays
    .filter((d) => d.isCurrentMonth)
    .reduce((sum, d) => sum + (meetingsByDate[toDateKey(d.date.toISOString())]?.length ?? 0), 0)

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalThisMonth} meeting{totalThisMonth !== 1 ? 's' : ''} in {MONTH_NAMES[viewMonth]}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs"
          >
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-semibold text-foreground">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body: calendar + optional detail panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5 gap-3">
          {/* Day-of-week labels */}
          <div className="grid grid-cols-7 gap-2">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground py-1"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {isLoading ? (
            <CalendarSkeleton />
          ) : (
            <motion.div
              key={`${viewYear}-${viewMonth}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 gap-2"
            >
              {calendarDays.map((day, i) => {
                const key = toDateKey(day.date.toISOString())
                const dayMeetings = meetingsByDate[key] ?? []
                const isSelected = selectedDay ? sameDay(day.date, selectedDay) : false

                return (
                  <DayCell
                    key={i}
                    day={day}
                    meetings={dayMeetings}
                    isSelected={isSelected}
                    onClick={() =>
                      setSelectedDay(isSelected ? null : day.date)
                    }
                  />
                )
              })}
            </motion.div>
          )}

          {/* Empty state for whole month */}
          {!isLoading && totalThisMonth === 0 && (
            <div className="mt-4">
              <EmptyState
                icon={CalendarDays}
                title="No meetings this month"
                description="Meetings you upload will appear on the calendar by their date."
              />
            </div>
          )}
        </div>

        {/* Day detail panel */}
        <AnimatePresence>
          {selectedDay && (
            <DayDetailPanel
              day={selectedDay}
              meetings={selectedMeetings}
              onClose={() => setSelectedDay(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
