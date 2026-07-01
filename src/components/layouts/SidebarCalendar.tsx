import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/config/routes'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useMeetings } from '@/features/meetings/hooks/useMeetings'
import type { Meeting } from '@/types/database'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA') // YYYY-MM-DD
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatDayHeading(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// ─── Calendar grid builder ────────────────────────────────────────────────────

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date()
  const firstOfMonth = new Date(year, month, 1)
  const startPad = firstOfMonth.getDay() // 0 = Sunday

  const days: CalendarDay[] = []

  // Pad before
  for (let i = startPad - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({ date, isCurrentMonth: false, isToday: sameDay(date, today) })
  }

  // Current month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    days.push({ date, isCurrentMonth: true, isToday: sameDay(date, today) })
  }

  // Pad after to complete grid (fill to multiple of 7)
  const remainder = days.length % 7
  if (remainder !== 0) {
    const fill = 7 - remainder
    for (let i = 1; i <= fill; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false, isToday: sameDay(date, today) })
    }
  }

  return days
}

// ─── Meeting list for selected day ───────────────────────────────────────────

function DayMeetings({
  day,
  meetings,
  onClose,
}: {
  day: Date
  meetings: Meeting[]
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2 }}
      className="border-t border-border/50 pt-3 space-y-2"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {formatDayHeading(day)}
      </p>

      {meetings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Mic className="h-6 w-6 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No meetings this day</p>
        </div>
      ) : (
        <ul className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-480px)]">
          {meetings.map((meeting) => (
            <li key={meeting.id}>
              <Link
                to={ROUTES.meeting(meeting.id)}
                onClick={onClose}
                className="flex flex-col gap-1 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5 text-left transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                  {meeting.title}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(meeting.meeting_date ?? meeting.created_at)}
                  </span>
                  <StatusBadge status={meeting.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SidebarCalendarProps {
  onClose: () => void
}

export function SidebarCalendar({ onClose }: SidebarCalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(today)

  const { data: meetings = [] } = useMeetings()

  // Build a map: YYYY-MM-DD → Meeting[]
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
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const selectedMeetings = selectedDay
    ? (meetingsByDate[toDateKey(selectedDay.toISOString())] ?? [])
    : []

  return (
    <motion.div
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -16, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="fixed inset-y-0 left-64 z-10 flex w-56 flex-col border-r border-border/50 bg-surface-1"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold text-foreground">Calendar</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close calendar"
          className="rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <p className="text-xs font-semibold text-foreground">
            {formatMonthYear(new Date(viewYear, viewMonth))}
          </p>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-px">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-[10px] font-medium text-muted-foreground pb-1"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {calendarDays.map((day, i) => {
            const key = toDateKey(day.date.toISOString())
            const hasMeetings = !!meetingsByDate[key]?.length
            const meetingCount = meetingsByDate[key]?.length ?? 0
            const isSelected = selectedDay ? sameDay(day.date, selectedDay) : false

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDay(day.date)}
                aria-label={`${day.date.toDateString()}${hasMeetings ? `, ${meetingCount} meeting${meetingCount !== 1 ? 's' : ''}` : ''}`}
                aria-pressed={isSelected}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-md py-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !day.isCurrentMonth && 'opacity-30',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : day.isToday
                    ? 'border border-primary/50 text-primary font-semibold hover:bg-surface-2'
                    : 'text-foreground hover:bg-surface-2',
                )}
              >
                {day.date.getDate()}
                {hasMeetings && (
                  <span
                    className={cn(
                      'absolute bottom-0.5 h-1 w-1 rounded-full',
                      isSelected ? 'bg-primary-foreground/70' : 'bg-primary',
                    )}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day meetings */}
        <AnimatePresence mode="wait">
          {selectedDay && (
            <DayMeetings
              key={selectedDay.toDateString()}
              day={selectedDay}
              meetings={selectedMeetings}
              onClose={onClose}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
