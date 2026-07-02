import { useState } from 'react'
import { Plus, Search, Users, ArchiveX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import { useContacts } from '../hooks/useParticipants'
import { ParticipantCard } from '../components/ParticipantCard'
import { ParticipantFormDialog } from '../components/ParticipantFormDialog'
import type { Contact } from '@/types/database'

function ParticipantsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  )
}

export function ParticipantsPage() {
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Contact | null>(null)

  const debouncedSearch = useDebounce(search, 250)
  const { data: contacts = [], isLoading, isError } = useContacts({
    includeArchived: showArchived,
    search: debouncedSearch,
  })

  const active = contacts.filter((c) => !c.archived)
  const archived = contacts.filter((c) => c.archived)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            A shared directory of people in this workspace.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New Participant
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, email, or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showArchived ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowArchived((v) => !v)}
          className="gap-2 shrink-0"
        >
          <ArchiveX className="h-4 w-4" />
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <ParticipantsSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-destructive">Failed to load participants. Please try again.</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {debouncedSearch ? 'No participants match your search' : 'No participants yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {debouncedSearch
                ? 'Try a different name, email, or company.'
                : 'Add your first participant to get started.'}
            </p>
          </div>
          {!debouncedSearch && (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Participant
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active */}
          {active.length > 0 && (
            <section className="space-y-3">
              {showArchived && (
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active · {active.length}
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((c) => (
                  <ParticipantCard key={c.id} contact={c} onEdit={setEditTarget} />
                ))}
              </div>
            </section>
          )}

          {/* Archived */}
          {showArchived && archived.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Archived · {archived.length}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archived.map((c) => (
                  <ParticipantCard key={c.id} contact={c} onEdit={setEditTarget} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ParticipantFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <ParticipantFormDialog
          contact={editTarget}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}
    </div>
  )
}
