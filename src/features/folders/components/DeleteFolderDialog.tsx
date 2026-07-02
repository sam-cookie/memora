import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteFolder } from '../hooks/useFolders'

interface DeleteFolderDialogProps {
  folderId: string
  folderName: string
  meetingCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteFolderDialog({
  folderId,
  folderName,
  meetingCount,
  open,
  onOpenChange,
  onDeleted,
}: DeleteFolderDialogProps) {
  const deleteFolder = useDeleteFolder()

  async function handleDelete() {
    await deleteFolder.mutateAsync(folderId)
    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete folder?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">"{folderName}"</span> will be deleted.{' '}
            {meetingCount > 0
              ? `The ${meetingCount} meeting${meetingCount !== 1 ? 's' : ''} inside will be moved back to All Meetings — they won't be deleted.`
              : 'This cannot be undone.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteFolder.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => { void handleDelete() }}
            disabled={deleteFolder.isPending}
          >
            {deleteFolder.isPending ? 'Deleting…' : 'Delete folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
