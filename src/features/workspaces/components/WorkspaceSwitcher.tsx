import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Plus, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/providers/WorkspaceProvider'
import { WORKSPACE_COLORS } from '@/types/database'
import { ROUTES } from '@/config/routes'
import { WorkspaceAvatar } from './WorkspaceAvatar'
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface WorkspaceSwitcherProps {
  collapsed: boolean
  onClose?: () => void
}

export function WorkspaceSwitcher({ collapsed, onClose }: WorkspaceSwitcherProps) {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  if (!activeWorkspace) return null

  const colorEntry = WORKSPACE_COLORS.find((c) => c.value === activeWorkspace.color) ?? WORKSPACE_COLORS[1]

  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={cn(
          'group flex items-center gap-2 w-full rounded-lg px-2 py-1.5 transition-colors',
          'hover:bg-accent text-foreground',
          collapsed && 'justify-center px-0',
        )}
        aria-label="Switch workspace"
      >
        <WorkspaceAvatar workspace={activeWorkspace} size="sm" />
        {!collapsed && (
          <>
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-xs font-semibold truncate leading-tight">
                {activeWorkspace.name}
              </span>
              <span className="block text-[10px] text-muted-foreground leading-tight">Workspace</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          </>
        )}
      </button>
    </DropdownMenuTrigger>
  )

  return (
    <>
      <DropdownMenu>
        {collapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip disableHoverableContent>
              <TooltipTrigger asChild>{trigger}</TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {activeWorkspace.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          trigger
        )}

        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={4}
          className="w-56"
        >
          {workspaces.map((ws) => {
            const wsColor = WORKSPACE_COLORS.find((c) => c.value === ws.color) ?? WORKSPACE_COLORS[1]
            return (
              <DropdownMenuItem
                key={ws.id}
                className="flex items-center gap-2.5 cursor-pointer"
                onSelect={() => {
                  setActiveWorkspace(ws)
                  onClose?.()
                }}
              >
                <div className={cn('h-5 w-5 rounded-md flex items-center justify-center text-xs shrink-0', wsColor.bgClass, wsColor.textClass)}>
                  {ws.icon ?? ws.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-sm">{ws.name}</span>
                {ws.id === activeWorkspace.id && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="flex items-center gap-2.5 cursor-pointer"
            onSelect={() => setCreateOpen(true)}
          >
            <div className="h-5 w-5 rounded-md border border-dashed border-border flex items-center justify-center shrink-0">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-sm">New Workspace</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2.5 cursor-pointer"
            onSelect={() => {
              navigate(ROUTES.workspaces)
              onClose?.()
            }}
          >
            <div className="h-5 w-5 rounded-md flex items-center justify-center shrink-0">
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm">Manage Workspaces</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
