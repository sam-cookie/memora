import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { NewMeetingForm } from './NewMeetingForm'
import { ROUTES } from '@/config/routes'

interface NewMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewMeetingDialog({ open, onOpenChange }: NewMeetingDialogProps) {
  const navigate = useNavigate()

  const handleSuccess = (meetingId: string) => {
    onOpenChange(false)
    navigate(ROUTES.meeting(meetingId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold tracking-tight">Add New Meeting</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Upload a recording or transcript to get started
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="px-6 py-5">
          <NewMeetingForm
            isDialog
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
