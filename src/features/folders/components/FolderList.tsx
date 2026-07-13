import { useState } from 'react'
import { Folder, Inbox, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { FOLDER_COLORS, type Folder as FolderType } from '@/types/database'
import { useFolders } from '../hooks/useFolders'
import { CreateFolderDialog } from './CreateFolderDialog'
import { RenameFolderDialog } from './RenameFolderDialog'
import { DeleteFolderDialog } from './DeleteFolderDialog'

interface FolderListProps {
  selectedFolderId: string | null | 'all'
  onSelect: (folderId: string | null | 'all') => void
  meetingCounts: Record<string, number>
  totalCount: number
  hoveredFolderId?: string | null
}

interface FolderItemProps {
  folder: FolderType
  isSelected: boolean
  isHovered: boolean
  count: number
  onSelect: () => void
}

function FolderItem({ folder, isSelected, isHovered, count, onSelect }: FolderItemProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const colorConfig = FOLDER_COLORS.find((c) => c.value === folder.color) ?? FOLDER_COLORS[0]

  return (
    <>
      <li className="group relative" data-folder-id={folder.id}>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            'w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-100 text-left',
            isSelected
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            isHovered && 'ring-2 ring-primary ring-inset bg-primary/10 text-primary',
          )}
        >
          <Folder className={cn('h-3.5 w-3.5 shrink-0', colorConfig?.iconClass)} />
          <span className="flex-1 truncate leading-none">{folder.name}</span>
          <span
            className={cn(
              'text-[11px] tabular-nums min-w-[1.25rem] text-right shrink-0',
              isSelected ? 'text-primary/70' : 'text-muted-foreground/60',
            )}
          >
            {count}
          </span>
        </button>

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Options for ${folder.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>

      <RenameFolderDialog
        folder={folder}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <DeleteFolderDialog
        folderId={folder.id}
        folderName={folder.name}
        meetingCount={count}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => onSelect()}
      />
    </>
  )
}

export function FolderList({
  selectedFolderId,
  onSelect,
  meetingCounts,
  totalCount,
  hoveredFolderId,
}: FolderListProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: folders = [], isLoading } = useFolders()

  return (
    <>
      <aside className="w-[clamp(148px,14vw,200px)] shrink-0 flex flex-col gap-1 border-r border-border pr-[clamp(0.5rem,1.5vw,1rem)] pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2.5 mb-1">
          Folders
        </p>

        <ul className="space-y-0.5">
          <li data-folder-id="all">
            <button
              type="button"
              onClick={() => onSelect('all')}
              className={cn(
                'w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-100 text-left',
                selectedFolderId === 'all'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                hoveredFolderId === 'all' && 'ring-2 ring-primary ring-inset bg-primary/10 text-primary',
              )}
            >
              <Inbox className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 leading-none">All Meetings</span>
              <span
                className={cn(
                  'text-[11px] tabular-nums',
                  selectedFolderId === 'all' ? 'text-primary/70' : 'text-muted-foreground/60',
                )}
              >
                {totalCount}
              </span>
            </button>
          </li>

          {isLoading && (
            <>
              <li className="px-2.5 py-1.5"><Skeleton className="h-3 w-24" /></li>
              <li className="px-2.5 py-1.5"><Skeleton className="h-3 w-20" /></li>
            </>
          )}

          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              isSelected={selectedFolderId === folder.id}
              isHovered={hoveredFolderId === folder.id}
              count={meetingCounts[folder.id] ?? 0}
              onSelect={() => onSelect(folder.id)}
            />
          ))}
        </ul>

        <Button
          variant="ghost"
          size="sm"
          className="mt-1 justify-start gap-2 text-muted-foreground hover:text-foreground px-2.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Folder
        </Button>
      </aside>

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
