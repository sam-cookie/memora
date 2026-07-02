import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Users, MoreHorizontal, Pencil, Trash2, FolderInput, Folder, GripVertical } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ROUTES } from '@/config/routes'
import { EditMeetingDialog } from './EditMeetingDialog'
import { DeleteMeetingDialog } from './DeleteMeetingDialog'
import { MoveMeetingDialog } from '@/features/folders/components/MoveMeetingDialog'
import { useFolders } from '@/features/folders/hooks/useFolders'
import { FOLDER_COLORS } from '@/types/database'
import { cn } from '@/lib/utils'
import type { Meeting } from '@/types/database'

interface MeetingCardProps {
  meeting: Meeting
  index: number
  onDragStart?: (meetingId: string) => void
  onDragEnd?: () => void
  onDrop?: (meetingId: string, folderId: string | null) => void
  onHoverFolder?: (folderId: string | null) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function MeetingCard({ meeting, index, onDragStart, onDragEnd, onDrop, onHoverFolder }: MeetingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [localDragging, setLocalDragging] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const { data: folders = [] } = useFolders()
  const folder = meeting.folder_id ? folders.find((f) => f.id === meeting.folder_id) : null
  const folderColor = folder ? (FOLDER_COLORS.find((c) => c.value === folder.color) ?? FOLDER_COLORS[0]) : null
  const displayDate = meeting.processed_at ?? meeting.created_at
  const preview = meeting.summary ?? meeting.description

  return (
    <>
      <motion.div
        ref={cardRef}
        className="group cursor-grab active:cursor-grabbing"
        style={{ position: 'relative', zIndex: localDragging ? 50 : undefined }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
        drag
        dragMomentum={false}
        dragSnapToOrigin
        dragElastic={0}
        whileDrag={{ scale: 1.03 }}
        onDragStart={() => {
          setLocalDragging(true)
          // Disable pointer events so elementFromPoint sees through this card
          if (cardRef.current) cardRef.current.style.pointerEvents = 'none'
          onDragStart?.(meeting.id)
        }}
        onDrag={(_, info) => {
          const el = document.elementFromPoint(info.point.x, info.point.y)
          const fid = el?.closest('[data-folder-id]')?.getAttribute('data-folder-id') ?? null
          onHoverFolder?.(fid)
        }}
        onDragEnd={(_, info) => {
          setLocalDragging(false)
          if (cardRef.current) cardRef.current.style.pointerEvents = ''
          const el = document.elementFromPoint(info.point.x, info.point.y)
          const fid = el?.closest('[data-folder-id]')?.getAttribute('data-folder-id') ?? null
          if (fid !== null) {
            onDrop?.(meeting.id, fid === 'all' ? null : fid)
          }
          onHoverFolder?.(null)
          onDragEnd?.()
        }}
      >
        <Card interactive className={cn('relative p-5 space-y-3 h-full select-none', localDragging && 'shadow-2xl')}>
          <div className="flex items-start justify-between gap-2">
            <GripVertical className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />

            <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground flex-1">
              <Link
                draggable={false}
                to={ROUTES.meeting(meeting.id)}
                className="focus-visible:outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
                onClick={(e) => {
                  // Prevent navigation if the card was being dragged
                  if (localDragging) e.preventDefault()
                }}
              >
                {meeting.title}
              </Link>
            </h3>

            <div className="relative z-10 flex items-center gap-1.5 shrink-0">
              <StatusBadge status={meeting.status} />
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-surface-2 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                  aria-label="Meeting options"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setMoveOpen(true)}>
                    <FolderInput className="h-3.5 w-3.5 mr-2" />
                    Move to folder
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
          </div>

          {preview && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {preview}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatDate(displayDate)}
            </span>
            {meeting.participants && meeting.participants.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3 w-3 shrink-0" />
                {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
              </span>
            )}
            {folder && folderColor && (
              <span className="flex items-center gap-1 ml-auto shrink-0">
                <Folder className={cn('h-3 w-3 shrink-0', folderColor.iconClass)} />
                <span className="truncate max-w-[96px]">{folder.name}</span>
              </span>
            )}
          </div>
        </Card>
      </motion.div>

      <EditMeetingDialog
        meeting={meeting}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteMeetingDialog
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <MoveMeetingDialog
        meetingId={meeting.id}
        currentFolderId={meeting.folder_id}
        open={moveOpen}
        onOpenChange={setMoveOpen}
      />
    </>
  )
}
