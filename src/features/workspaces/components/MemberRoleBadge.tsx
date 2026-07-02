import { cn } from '@/lib/utils'
import type { WorkspaceRole } from '@/types/database'

const ROLE_STYLES: Record<WorkspaceRole, string> = {
  owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  member: 'bg-muted text-muted-foreground',
}

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

interface MemberRoleBadgeProps {
  role: WorkspaceRole
  className?: string
}

export function MemberRoleBadge({ role, className }: MemberRoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        ROLE_STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
