import { useMemo, useState } from 'react'
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
import { FolderList } from '@/features/folders/components/FolderList'
import { useMoveMeetingToFolder } from '@/features/folders/hooks/useFolders'
import { cn } from '@/lib/utils'

type FolderSelection = string | null | 'all'

function MeetingsSkeleton() {
  return (
    <div className="grid grid-cards gap-4">
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
  const [selectedFolder, setSelectedFolder] = useState<FolderSelection>('all')
  const [draggingMeetingId, setDraggingMeetingId] = useState<string | null>(null)
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search, 250)
  const { data: meetings, isLoading, isError } = useMeetings()
  const moveMeeting = useMoveMeetingToFolder()

  // Count how many meetings belong to each folder
  const meetingCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of meetings ?? []) {
      if (m.folder_id) counts[m.folder_id] = (counts[m.folder_id] ?? 0) + 1
    }
    return counts
  }, [meetings])

  const handleFolderSelect = (folderId: FolderSelection) => {
    setSelectedFolder(folderId)
    setSearch('')
  }

  // Filter by selected folder, then by search term
  const filtered = useMemo(() => {
    const all = meetings ?? []
    const byFolder =
      selectedFolder === 'all'
        ? all
        : all.filter((m) => m.folder_id === selectedFolder)
    return byFolder.filter((m) =>
      m.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
    )
  }, [meetings, selectedFolder, debouncedSearch])

  const totalCount = meetings?.length ?? 0
  const hasMeetings = totalCount > 0

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

      <div className={cn('flex flex-1', draggingMeetingId ? '' : 'overflow-hidden')}>
        {/* Folder sidebar */}
        <div className="hidden md:flex flex-col p-[clamp(0.75rem,2vw,1.5rem)] pr-0 relative z-0">
          <FolderList
            selectedFolderId={selectedFolder}
            onSelect={handleFolderSelect}
            meetingCounts={meetingCounts}
            totalCount={totalCount}
            hoveredFolderId={hoveredFolderId}
          />
        </div>

        {/* Meetings content */}
        <div className={cn(
          'flex-1 p-[clamp(0.75rem,2vw,1.5rem)] space-y-4 min-w-0 relative z-10',
          draggingMeetingId ? 'overflow-visible' : 'overflow-y-auto',
        )}>
          {hasMeetings && (
            <div className="relative max-w-[clamp(240px,50%,384px)]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Filter meetings…"
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
              description={
                debouncedSearch
                  ? `No meetings found matching "${debouncedSearch}".`
                  : 'This folder is empty.'
              }
            />
          )}

          {filtered.length > 0 && (
            <div className="grid grid-cards gap-4">
              {filtered.map((meeting, i) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  index={i}
                  onDragStart={setDraggingMeetingId}
                  onDragEnd={() => setDraggingMeetingId(null)}
                  onDrop={(meetingId, folderId) => moveMeeting.mutate({ meetingId, folderId })}
                  onHoverFolder={setHoveredFolderId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
