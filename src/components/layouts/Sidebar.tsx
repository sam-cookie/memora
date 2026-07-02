import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Mic,
  Settings,
  Upload,
  Plus,
  LogOut,
  BarChart2,
  CheckSquare,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { generateInitials, truncate } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import memoraLogo from '@/assets/memora.png'
import { WorkspaceSwitcher } from '@/features/workspaces/components/WorkspaceSwitcher'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  exact?: boolean
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: ROUTES.dashboard, exact: true },
  { label: 'Meetings', icon: Mic, to: ROUTES.meetings },
  { label: 'Calendar', icon: CalendarDays, to: ROUTES.calendar },
  { label: 'Action Items', icon: CheckSquare, to: ROUTES.actionItems },
  { label: 'Participants', icon: Users, to: ROUTES.participants },
  { label: 'Analytics', icon: BarChart2, to: ROUTES.analytics },
]

const SECONDARY_NAV: NavItem[] = [
  { label: 'Upload', icon: Upload, to: ROUTES.meetingNew },
  { label: 'Settings', icon: Settings, to: ROUTES.settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  isMobile: boolean
  collapsed: boolean
  onToggleCollapse: () => void
}

function NavGroup({
  items,
  isMobile,
  collapsed,
  onClose,
}: {
  items: NavItem[]
  isMobile: boolean
  collapsed: boolean
  onClose: () => void
}) {
  return (
    <TooltipProvider delayDuration={0}>
      {items.map((item) => (
        <Tooltip key={item.to} disableHoverableContent>
          <TooltipTrigger asChild>
            <NavLink
              to={item.to}
              end={item.exact ?? false}
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-100',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  {!collapsed && (
                    <span className="flex-1 leading-none truncate">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="text-xs">
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      ))}
    </TooltipProvider>
  )
}

function SidebarContent({
  isMobile,
  collapsed,
  onClose,
  onToggleCollapse,
}: {
  isMobile: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate(ROUTES.login)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-border',
          collapsed ? 'flex-col justify-center gap-1.5 px-2 py-2 h-auto' : 'justify-between px-4',
        )}
      >
        <div className={cn('flex items-center gap-2.5 min-w-0', collapsed && 'pt-1')}>
          <img src={memoraLogo} alt="Memora" className="h-7 w-7 shrink-0" />
          {!collapsed && (
            <span className="text-[15px] font-bold tracking-tight text-foreground font-display truncate">
              Memora
            </span>
          )}
        </div>
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className={cn('px-2 pt-2 pb-1', collapsed ? 'px-2' : 'px-3')}>
        <WorkspaceSwitcher collapsed={collapsed} onClose={isMobile ? onClose : undefined} />
      </div>

      {/* New Meeting CTA */}
      <div className={cn('pt-2 pb-2', collapsed ? 'px-2' : 'px-3')}>
        <TooltipProvider delayDuration={0}>
          <Tooltip disableHoverableContent>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className={cn('gap-2 font-medium', collapsed ? 'w-full px-0 justify-center' : 'w-full')}
                onClick={() => {
                  navigate(ROUTES.meetingNew)
                  if (isMobile) onClose()
                }}
                aria-label={collapsed ? 'New Meeting' : undefined}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                {!collapsed && 'New Meeting'}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="text-xs">
                New Meeting
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Primary Navigation */}
      <nav
        className={cn('flex-1 overflow-y-auto py-2 space-y-0.5', collapsed ? 'px-2' : 'px-3')}
        aria-label="Main navigation"
      >
        <NavGroup items={PRIMARY_NAV} isMobile={isMobile} collapsed={collapsed} onClose={onClose} />
      </nav>

      {/* Secondary Navigation */}
      <div className={cn('py-2 space-y-0.5 border-t border-border', collapsed ? 'px-2' : 'px-3')}>
        <NavGroup items={SECONDARY_NAV} isMobile={isMobile} collapsed={collapsed} onClose={onClose} />
      </div>

      {/* User section */}
      <div className={cn('border-t border-border p-2', !collapsed && 'p-3')}>
        <TooltipProvider delayDuration={0}>
          <Tooltip disableHoverableContent>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'group flex items-center gap-2.5 rounded-md py-2 hover:bg-accent transition-colors cursor-default',
                  collapsed ? 'justify-center px-0' : 'px-2',
                )}
              >
                <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border">
                  <AvatarImage src={user?.user_metadata?.['avatar_url'] as string | undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                    {user?.user_metadata?.['full_name']
                      ? generateInitials(user.user_metadata['full_name'] as string)
                      : (user?.email?.charAt(0).toUpperCase() ?? '?')}
                  </AvatarFallback>
                </Avatar>

                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate leading-tight">
                        {(user?.user_metadata?.['full_name'] as string | undefined) ??
                          truncate(user?.email ?? 'User', 20)}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate leading-tight">
                        {truncate(user?.email ?? '', 22)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => void handleSignOut()}
                      title="Sign out"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="text-xs">
                {(user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? 'Account'}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

    </div>
  )
}

export function Sidebar({ open, onClose, isMobile, collapsed, onToggleCollapse }: SidebarProps) {
  const sidebarWidth = collapsed ? 'w-16' : 'w-64'

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-surface-1"
            aria-label="Sidebar"
          >
            <SidebarContent
              isMobile
              collapsed={false}
              onClose={onClose}
              onToggleCollapse={onToggleCollapse}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    )
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 border-r border-border bg-surface-1 transition-all duration-200 overflow-hidden',
        sidebarWidth,
      )}
      aria-label="Sidebar"
    >
      <SidebarContent
        isMobile={false}
        collapsed={collapsed}
        onClose={onClose}
        onToggleCollapse={onToggleCollapse}
      />
    </aside>
  )
}
