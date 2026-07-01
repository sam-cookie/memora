import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import { ROUTES } from '@/config/routes'
import { useMeetings } from '../hooks/useMeetings'
import { MeetingCard } from '../components/MeetingCard'

function MeetingsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
      ))}
    </div>
  )
}

export function MeetingsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const { data: meetings, isLoading, isError } = useMeetings()

  const filtered = meetings?.filter((m) =>
    m.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
  ) ?? []

  const hasMeetings = (meetings?.length ?? 0) > 0

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Meetings"
        description="All your recorded and processed meetings"
        icon={Mic}
        actions={
          <Button asChild size="sm">
            <Link to={ROUTES.meetingNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Meeting
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-5">
        {hasMeetings && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Filter meetings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Filter meetings by title"
            />
          </div>
        )}

        {isLoading && <MeetingsSkeleton />}

        {isError && (
          <EmptyState
            icon={Mic}
            title="Failed to load meetings"
            description="Something went wrong fetching your meetings. Please refresh the page."
          />
        )}

        {!isLoading && !isError && !hasMeetings && (
          <EmptyState
            icon={Mic}
            title="No meetings yet"
            description="Upload a recording or transcript to get started."
            action={{ label: 'Upload your first meeting', onClick: () => navigate(ROUTES.meetingNew) }}
          />
        )}

        {!isLoading && !isError && hasMeetings && filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title="No matches"
            description={`No meetings found matching "${debouncedSearch}".`}
          />
        )}

        {filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((meeting, i) => (
              <MeetingCard key={meeting.id} meeting={meeting} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
