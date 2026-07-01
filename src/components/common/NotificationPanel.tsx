import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  CheckCheck,
  FileText,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import type { NotificationType } from '@/features/notifications/services/notifications.service'

// ─── Icon + color config per notification type ────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; iconBg: string; iconText: string }
> = {
  meeting_completed: {
    icon: FileText,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconText: 'text-blue-600 dark:text-blue-400',
  },
  meeting_processing: {
    icon: Loader2,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    iconText: 'text-amber-500 dark:text-amber-400',
  },
  task_completed: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconText: 'text-emerald-600 dark:text-emerald-400',
  },
  task_overdue: {
    icon: AlertTriangle,
    iconBg: 'bg-red-50 dark:bg-red-950/40',
    iconText: 'text-red-500 dark:text-red-400',
  },
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate()
  const { data: notifications = [], isLoading } = useNotifications()
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('memora-read-notifications')
      return new Set(stored ? (JSON.parse(stored) as string[]) : [])
    } catch {
      return new Set()
    }
  })

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  const markAllRead = () => {
    const all = new Set(notifications.map((n) => n.id))
    setReadIds(all)
    localStorage.setItem('memora-read-notifications', JSON.stringify([...all]))
  }

  const markRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('memora-read-notifications', JSON.stringify([...next]))
      return next
    })
  }

  return (
    <div className="flex flex-col" style={{ width: 360, maxHeight: 520 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-4.5 min-w-[1.125rem] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={markAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-3 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">All quiet here</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Completed meetings and tasks will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {notifications.map((notification) => {
              const { icon: Icon, iconBg, iconText } = TYPE_CONFIG[notification.type]
              const isRead = readIds.has(notification.id)
              const isSpinning = notification.type === 'meeting_processing'

              return (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                    'hover:bg-surface-1',
                    !isRead && 'bg-primary/[0.02]',
                  )}
                  onClick={() => {
                    markRead(notification.id)
                    navigate(notification.href)
                    onClose()
                  }}
                >
                  {/* Icon */}
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    iconBg,
                  )}>
                    <Icon
                      className={cn('h-3.5 w-3.5', iconText, isSpinning && 'animate-spin')}
                      strokeWidth={2}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'text-xs font-semibold leading-tight',
                        isRead ? 'text-muted-foreground' : 'text-foreground',
                      )}>
                        {notification.title}
                      </p>
                      <span className="text-[11px] text-muted-foreground/60 shrink-0 tabular-nums">
                        {notification.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                      {notification.description}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!isRead && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border px-4 py-2.5">
          <p className="text-[11px] text-muted-foreground/50 text-center">
            Showing your {notifications.length} most recent activities
          </p>
        </div>
      )}
    </div>
  )
}
