import { cn } from '@/lib/utils'
import { WORKSPACE_COLORS } from '@/types/database'
import type { Workspace } from '@/types/database'

interface WorkspaceAvatarProps {
  workspace: Workspace
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-6 w-6 text-[11px]',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
}

export function WorkspaceAvatar({ workspace, size = 'md', className }: WorkspaceAvatarProps) {
  const colorEntry = WORKSPACE_COLORS.find((c) => c.value === workspace.color) ?? WORKSPACE_COLORS[0]
  if (!colorEntry) return null

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg font-semibold shrink-0',
        SIZE_CLASSES[size],
        colorEntry.bgClass,
        colorEntry.textClass,
        className,
      )}
    >
      {workspace.icon ?? workspace.name.charAt(0).toUpperCase()}
    </div>
  )
}
