import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ROUTES } from '@/config/routes'
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
  const displayDate = meeting.processed_at ?? meeting.created_at
  const preview = meeting.summary ?? meeting.description

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Link
        to={ROUTES.meeting(meeting.id)}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <Card interactive className="p-5 space-y-3 h-full">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground flex-1">
              {meeting.title}
            </h3>
            <StatusBadge status={meeting.status} />
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
      </Link>
    </motion.div>
  )
}
