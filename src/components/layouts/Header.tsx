import { useState } from 'react'
import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { SearchCommand } from '@/components/common/SearchCommand'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { NotificationPanel } from '@/components/common/NotificationPanel'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: notifications = [] } = useNotifications()

  // Count unread — use localStorage to track read state
  const unreadCount = (() => {
    try {
      const stored = localStorage.getItem('memora-read-notifications')
      const readIds = new Set<string>(stored ? (JSON.parse(stored) as string[]) : [])
      return notifications.filter((n) => !readIds.has(n.id)).length
    } catch {
      return notifications.length
    }
  })()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-8 w-8 text-muted-foreground hover:text-foreground',
            open && 'bg-accent text-foreground',
          )}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 flex h-[7px] w-[7px] items-center justify-center rounded-full bg-primary"
              aria-hidden="true"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0">
        <NotificationPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

export function Header({ onMenuClick }: HeaderProps) {
  const isMobile = useIsMobile()

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8 shrink-0">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      )}

      <div className="flex-1">
        <SearchCommand />
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  )
}
