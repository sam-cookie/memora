import { useEffect, useRef, useState } from 'react'
import { Search, X, Loader2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn, formatRelativeTime } from '@/lib/utils'
import { ROUTES } from '@/config/routes'
import { useSearch } from '@/features/search/hooks/useSearch'
import { StatusBadge } from '@/components/common/StatusBadge'

export function SearchCommand() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data, isFetching } = useSearch(query)

  const hasResults =
    (data?.meetings.length ?? 0) + (data?.actionItems.length ?? 0) > 0
  const showDropdown = open && query.trim().length >= 2

  // Ctrl+K / Cmd+K to focus
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const clear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const goToMeeting = (id: string) => {
    navigate(ROUTES.meeting(id))
    setOpen(false)
    setQuery('')
  }

  const goToAllResults = () => {
    if (!query.trim()) return
    navigate(`${ROUTES.search}?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
    }
    if (e.key === 'Enter' && query.trim()) {
      goToAllResults()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Input bar */}
      <div
        className={cn(
          'flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-all duration-150',
          open && query
            ? 'border-primary/50 bg-surface-2 ring-1 ring-primary/20'
            : 'border-border bg-surface-1 hover:border-border/80 hover:bg-surface-2',
        )}
      >
        {isFetching ? (
          <Loader2 className="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search meetings..."
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          aria-label="Search meetings (Ctrl+K)"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />

        {query ? (
          <button
            type="button"
            onClick={clear}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-medium sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {/* Initial loading state */}
          {isFetching && !data && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          )}

          {/* No results */}
          {!isFetching && data && !hasResults && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No results for{' '}
                <span className="text-foreground font-medium">"{query}"</span>
              </p>
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <>
              {data!.meetings.length > 0 && (
                <section>
                  <p className="border-b border-border/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Meetings
                  </p>
                  {data!.meetings.slice(0, 5).map((meeting) => (
                    <button
                      key={meeting.id}
                      type="button"
                      onClick={() => goToMeeting(meeting.id)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {meeting.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(meeting.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={meeting.status} />
                    </button>
                  ))}
                </section>
              )}

              {data!.actionItems.length > 0 && (
                <section>
                  <p className="border-b border-border/50 border-t border-t-border/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Action Items
                  </p>
                  {data!.actionItems.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToMeeting(item.meeting_id)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-foreground">{item.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.meetingTitle}
                        </p>
                      </div>
                      {item.completed && (
                        <span className="shrink-0 text-xs font-medium text-emerald-500">
                          Done
                        </span>
                      )}
                    </button>
                  ))}
                </section>
              )}

              <button
                type="button"
                onClick={goToAllResults}
                className="flex w-full items-center justify-center gap-1.5 border-t border-border/50 px-4 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-surface-2"
              >
                See all results
                <ArrowRight className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
