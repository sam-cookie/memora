import { Menu, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { SearchCommand } from '@/components/common/SearchCommand'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const isMobile = useIsMobile()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-md">
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      )}

      <div className="flex-1">
        <SearchCommand />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <User className="h-4.5 w-4.5" />
          <span className="sr-only">Profile</span>
        </Button>
      </div>
    </header>
  )
}
