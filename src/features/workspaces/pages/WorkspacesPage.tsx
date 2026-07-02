import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, Check, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/providers/WorkspaceProvider'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { WorkspaceAvatar } from '../components/WorkspaceAvatar'
import { MemberRoleBadge } from '../components/MemberRoleBadge'
import { CreateWorkspaceDialog } from '../components/CreateWorkspaceDialog'
import { EditWorkspaceDialog } from '../components/EditWorkspaceDialog'
import { DeleteWorkspaceDialog } from '../components/DeleteWorkspaceDialog'
import { ManageMembersDialog } from '../components/ManageMembersDialog'
import { useMembers } from '../hooks/useMembers'
import type { Workspace, WorkspaceRole } from '@/types/database'

// Per-workspace member count — small hook wrapper to keep the page clean
function useMemberCount(workspaceId: string) {
  const { data } = useMembers(workspaceId)
  return data?.length ?? 0
}

function WorkspaceCard({
  ws,
  isActive,
  myRole,
  onSwitch,
  onEdit,
  onDelete,
  onMembers,
}: {
  ws: Workspace
  isActive: boolean
  myRole: WorkspaceRole | null
  onSwitch: () => void
  onEdit: () => void
  onDelete: () => void
  onMembers: () => void
}) {
  const memberCount = useMemberCount(ws.id)
  const isOwner = myRole === 'owner'

  return (
    <Card
      className={cn(
        'relative p-4 flex items-start gap-4 transition-all cursor-pointer group',
        isActive
          ? 'ring-2 ring-primary border-primary/30'
          : 'hover:border-border/80 hover:shadow-sm',
      )}
      onClick={onSwitch}
    >
      <WorkspaceAvatar workspace={ws} size="lg" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm truncate">{ws.name}</h3>
          {isActive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
              <Check className="h-2.5 w-2.5" />
              Active
            </span>
          )}
          {myRole && <MemberRoleBadge role={myRole} />}
        </div>

        {ws.description ? (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{ws.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground/50 mt-0.5 italic">No description</p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(ws.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Stop propagation so dropdown clicks don't switch workspace */}
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Workspace options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onSelect={onMembers}>
              <Users className="h-3.5 w-3.5" />
              Manage Members
            </DropdownMenuItem>
            {isOwner && (
              <>
                <DropdownMenuItem className="gap-2" onSelect={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onSelect={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}

export function WorkspacesPage() {
  const { activeWorkspace, setActiveWorkspace, activeWorkspaceRole } = useWorkspace()
  const { data: workspaces = [], isLoading } = useWorkspaces()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Workspace | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null)
  const [membersTarget, setMembersTarget] = useState<Workspace | null>(null)

  // Build a role map from the memberships we already have in the provider
  // We need per-workspace roles for all workspaces, not just the active one.
  // Re-fetch them from the members query on each card. The role on the active
  // workspace is available from context; for others we rely on the card.

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organise your meetings into separate workspaces.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-sm">No workspaces yet.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
            Create your first workspace
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workspaces.map((ws) => (
            <WorkspaceCard
              key={ws.id}
              ws={ws}
              isActive={ws.id === activeWorkspace?.id}
              myRole={ws.id === activeWorkspace?.id ? activeWorkspaceRole : null}
              onSwitch={() => setActiveWorkspace(ws)}
              onEdit={() => setEditTarget(ws)}
              onDelete={() => setDeleteTarget(ws)}
              onMembers={() => setMembersTarget(ws)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editTarget && (
        <EditWorkspaceDialog
          workspace={editTarget}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteWorkspaceDialog
          workspace={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        />
      )}

      {membersTarget && (
        <ManageMembersDialog
          workspace={membersTarget}
          open={!!membersTarget}
          onOpenChange={(open) => !open && setMembersTarget(null)}
        />
      )}
    </div>
  )
}
