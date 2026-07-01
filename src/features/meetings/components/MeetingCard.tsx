import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import type { Meeting } from '@/types/database'

interface MeetingCardProps {
  meeting: Meeting
  index: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function MeetingCard({ meeting, index }: MeetingCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const displayDate = meeting.processed_at ?? meeting.created_at
  const preview = meeting.summary ?? meeting.description

  return (
    <>
      <motion.div
        className="group"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
      >
        <Card interactive className="relative p-5 space-y-3 h-full">
          <div className="flex items-start justify-between gap-2">
            {/* Title — link stretches to cover the whole card via ::after */}
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground flex-1">
              <Link
                to={ROUTES.meeting(meeting.id)}
                className="focus-visible:outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
              >
                {meeting.title}
              </Link>
            </h3>

            {/* Actions — z-10 to sit above the ::after overlay */}
            <div className="relative z-10 flex items-center gap-1.5 shrink-0">
              <StatusBadge status={meeting.status} />
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-surface-2 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                  aria-label="Meeting options"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit
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

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
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
    </>
  )
}
