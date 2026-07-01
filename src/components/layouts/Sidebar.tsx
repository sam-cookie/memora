import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Mic,
  Settings,
  Upload,
  Plus,
  Brain,
  LogOut,
  ChevronRight,
  BarChart2,
  CheckSquare,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { generateInitials, truncate } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: ROUTES.dashboard, exact: true },
  { label: 'Meetings', icon: Mic, to: ROUTES.meetings },
  { label: 'Calendar', icon: CalendarDays, to: ROUTES.calendar },
  { label: 'Action Items', icon: CheckSquare, to: ROUTES.actionItems },
  { label: 'Analytics', icon: BarChart2, to: ROUTES.analytics },
  { label: 'Upload', icon: Upload, to: ROUTES.meetingNew },
  { label: 'Settings', icon: Settings, to: ROUTES.settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  isMobile: boolean
}

export function Sidebar({ open, onClose, isMobile }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate(ROUTES.login)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-glow-sm">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-gradient-brand">Memora</span>
      </div>

      {/* New Meeting CTA */}
      <div className="px-3 py-4">
        <Button
          className="w-full gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/40 transition-all"
          variant="ghost"
          onClick={() => {
            navigate(ROUTES.meetingNew)
            if (isMobile) onClose()
          }}
        >
          <Plus className="h-4 w-4" />
          New Meeting
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3">
        <TooltipProvider delayDuration={0}>
          {NAV_ITEMS.map((item) => (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  end={item.exact ?? false}
                  onClick={isMobile ? onClose : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn('h-4 w-4 shrink-0 transition-colors', isActive && 'text-primary')}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="h-3 w-3 text-primary/50" />
                      )}
                    </>
                  )}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      {/* User section */}
      <div className="border-t border-border/50 p-3">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-2 transition-colors group">
          <Avatar className="h-8 w-8 ring-1 ring-border">
            <AvatarImage src={user?.user_metadata?.['avatar_url'] as string | undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {user?.user_metadata?.['full_name']
                ? generateInitials(user.user_metadata['full_name'] as string)
                : (user?.email?.charAt(0).toUpperCase() ?? '?')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {(user?.user_metadata?.['full_name'] as string | undefined) ??
                truncate(user?.email ?? 'User', 20)}
            </p>
            <p className="text-2xs text-muted-foreground truncate">{user?.email}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => void handleSignOut()}
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed inset-y-0 left-0 z-40 w-64 border-r border-border/50 bg-surface-1"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-border/50 bg-surface-1">
      {sidebarContent}
    </aside>
  )
}
