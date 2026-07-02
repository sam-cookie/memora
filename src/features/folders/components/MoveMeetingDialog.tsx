import { Folder, Inbox } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMoveMeetingToFolder, useFolders } from '../hooks/useFolders'
import { FOLDER_COLORS } from '@/types/database'
import { cn } from '@/lib/utils'

interface MoveMeetingDialogProps {
  meetingId: string
  currentFolderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MoveMeetingDialog({
  meetingId,
  currentFolderId,
  open,
  onOpenChange,
}: MoveMeetingDialogProps) {
  const { data: folders = [] } = useFolders()
  const move = useMoveMeetingToFolder()

  async function handleSelect(folderId: string | null) {
    await move.mutateAsync({ meetingId, folderId })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Move to folder</DialogTitle>
        </DialogHeader>

        <ul className="space-y-0.5 -mx-1 pt-1">
          {/* No folder option */}
          <li>
            <button
              type="button"
              onClick={() => { void handleSelect(null) }}
              disabled={move.isPending}
              className={cn(
                'w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left transition-colors',
                currentFolderId === null
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Inbox className="h-3.5 w-3.5 shrink-0" />
              All Meetings
            </button>
          </li>

          {folders.map((folder) => {
            const colorConfig = FOLDER_COLORS.find((c) => c.value === folder.color) ?? FOLDER_COLORS[0]
            const isActive = currentFolderId === folder.id

            return (
              <li key={folder.id}>
                <button
                  type="button"
                  onClick={() => { void handleSelect(folder.id) }}
                  disabled={move.isPending}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <Folder className={cn('h-3.5 w-3.5 shrink-0', colorConfig.iconClass)} />
                  <span className="truncate">{folder.name}</span>
                </button>
              </li>
            )
          })}

          {folders.length === 0 && (
            <li className="px-3 py-4 text-xs text-muted-foreground text-center">
              No folders yet. Create one from the Meetings page.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
