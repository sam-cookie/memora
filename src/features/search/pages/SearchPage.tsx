import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Mic, CheckSquare, ArrowRight, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useDebounce } from '@/hooks/useDebounce'
import { ROUTES } from '@/config/routes'
import { useSearch } from '../hooks/useSearch'
import type { Meeting } from '@/types/database'
import type { ActionItemResult } from '../services/search.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function getExcerpt(text: string, query: string, window = 120): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, window) + (text.length > window ? '…' : '')
  const start = Math.max(0, idx - 60)
  const end = Math.min(text.length, idx + query.length + window)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Result rows ──────────────────────────────────────────────────────────────

function MeetingResult({ meeting, query, index }: { meeting: Meeting; query: string; index: number }) {
  const preview =
    (meeting.summary && meeting.summary.toLowerCase().includes(query.toLowerCase()))
      ? getExcerpt(meeting.summary, query)
      : meeting.transcript && meeting.transcript.toLowerCase().includes(query.toLowerCase())
      ? getExcerpt(meeting.transcript, query)
      : meeting.summary?.slice(0, 140) ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        to={ROUTES.meeting(meeting.id)}
        className="group flex items-start gap-4 rounded-lg p-4 hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
          <Mic className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              <Highlight text={meeting.title} query={query} />
            </span>
            <StatusBadge status={meeting.status} />
          </div>
          {preview && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              <Highlight text={preview} query={query} />
            </p>
          )}
          <p className="text-xs text-muted-foreground/60">{formatDate(meeting.created_at)}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 shrink-0 mt-1 transition-opacity" />
      </Link>
    </motion.div>
  )
}

function ActionItemResult({ item, query, index }: { item: ActionItemResult; query: number | string; index: number }) {
  const PRIORITY_COLOR: Record<string, string> = {
    low: 'secondary', medium: 'warning', high: 'destructive', critical: 'destructive',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        to={ROUTES.meeting(item.meeting_id)}
        className="group flex items-start gap-4 rounded-lg p-4 hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 mt-0.5">
          <CheckSquare className="h-4 w-4 text-sky-500" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            <Highlight text={item.content} query={String(query)} />
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={PRIORITY_COLOR[item.priority] as never} className="text-xs">
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Badge>
            <span className="text-xs text-muted-foreground">in {item.meetingTitle}</span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 shrink-0 mt-1 transition-opacity" />
      </Link>
    </motion.div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, count }: { icon: typeof Mic; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">{count}</span>
    </div>
  )
}

function ResultSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, isFetching } = useSearch(debouncedQuery)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function setQuery(value: string) {
    if (value) setSearchParams({ q: value }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  const meetings = data?.meetings ?? []
  const actionItems = data?.actionItems ?? []
  const total = meetings.length + actionItems.length
  const hasResults = total > 0
  const hasQuery = debouncedQuery.length >= 2

  return (
    <div className="flex flex-col min-h-full">
      {/* Search bar */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meetings, transcripts, summaries, action items…"
            className="pl-10 pr-10 h-11 text-base"
            aria-label="Search"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {hasQuery && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {isFetching
              ? 'Searching…'
              : hasResults
              ? `${total} result${total !== 1 ? 's' : ''} for "${debouncedQuery}"`
              : `No results for "${debouncedQuery}"`}
          </p>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Idle */}
        {!hasQuery && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-3 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 border border-border">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Search your meetings</p>
              <p className="text-xs text-muted-foreground">
                Find across titles, summaries, transcripts, and action items
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {hasQuery && isFetching && (
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/50">
            {Array.from({ length: 4 }).map((_, i) => <ResultSkeleton key={i} />)}
          </div>
        )}

        {/* No results */}
        {hasQuery && !isFetching && !hasResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-3 text-center"
          >
            <p className="text-sm font-medium text-foreground">No results found</p>
            <p className="text-xs text-muted-foreground">
              Try different keywords or check your spelling.
            </p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {hasQuery && !isFetching && hasResults && (
            <div className="space-y-4">
              {meetings.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <SectionHeader icon={Mic} label="Meetings" count={meetings.length} />
                  <div className="divide-y divide-border/40">
                    {meetings.map((m, i) => (
                      <MeetingResult key={m.id} meeting={m} query={debouncedQuery} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {actionItems.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <SectionHeader icon={CheckSquare} label="Action Items" count={actionItems.length} />
                  <div className="divide-y divide-border/40">
                    {actionItems.map((item, i) => (
                      <ActionItemResult key={item.id} item={item} query={debouncedQuery} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        {hasQuery && isFetching && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Searching…
          </div>
        )}
      </div>
    </div>
  )
}
