import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Workspace } from '@/types/database'
import { useDeleteWorkspace } from '../hooks/useWorkspaces'
import { useWorkspace } from '@/providers/WorkspaceProvider'

interface DeleteWorkspaceDialogProps {
  workspace: Workspace
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteWorkspaceDialog({ workspace, open, onOpenChange }: DeleteWorkspaceDialogProps) {
  const deleteWorkspace = useDeleteWorkspace()
  const { workspaces, setActiveWorkspace, activeWorkspace } = useWorkspace()

  const handleDelete = async () => {
    await deleteWorkspace.mutateAsync(workspace.id)
    if (activeWorkspace?.id === workspace.id) {
      const next = workspaces.find((w) => w.id !== workspace.id)
      if (next) setActiveWorkspace(next)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{workspace.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will permanently delete the workspace. Meetings and folders inside it will{' '}
            <strong>not</strong> be deleted — they will simply become unassigned. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleteWorkspace.isPending}
          >
            {deleteWorkspace.isPending ? 'Deleting…' : 'Delete Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
