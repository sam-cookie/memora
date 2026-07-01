import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteMeeting } from '../hooks/useMeetingDetail'

interface DeleteMeetingDialogProps {
  meetingId: string
  meetingTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteMeetingDialog({
  meetingId,
  meetingTitle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteMeetingDialogProps) {
  const deleteMutation = useDeleteMeeting()

  async function handleDelete() {
    await deleteMutation.mutateAsync(meetingId)
    onOpenChange(false)
    onDeleted?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete meeting?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">"{meetingTitle}"</span> will be
            permanently deleted along with all its action items, decisions, and risks. This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => { void handleDelete() }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
