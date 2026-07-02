import { useState } from 'react'
import { UserPlus, MoreHorizontal, Crown, Shield, User, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/providers/WorkspaceProvider'
import { useMembers, useAddMember, useUpdateMemberRole, useRemoveMember } from '../hooks/useMembers'
import { MemberRoleBadge } from './MemberRoleBadge'
import { generateInitials } from '@/lib/utils'
import type { Workspace, WorkspaceRole } from '@/types/database'

const ROLE_OPTIONS: { value: WorkspaceRole; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Can invite and manage members' },
  { value: 'member', label: 'Member', icon: User, description: 'Can view and add meetings' },
]

interface ManageMembersDialogProps {
  workspace: Workspace
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageMembersDialog({ workspace, open, onOpenChange }: ManageMembersDialogProps) {
  const { user } = useAuth()
  const { isOwner, isAdminOrOwner, activeWorkspaceRole } = useWorkspace()
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member')
  const [inviteError, setInviteError] = useState<string | null>(null)

  const { data: members = [], isLoading } = useMembers(workspace.id)
  const addMember = useAddMember(workspace.id)
  const updateRole = useUpdateMemberRole(workspace.id)
  const removeMember = useRemoveMember(workspace.id)

  const handleInvite = async () => {
    if (!email.trim()) return
    setInviteError(null)
    try {
      await addMember.mutateAsync({ email: email.trim(), role: inviteRole })
      setEmail('')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to add member.')
    }
  }

  const canManageMember = (targetRole: WorkspaceRole, targetUserId: string) => {
    if (targetUserId === user?.id) return false // can't manage yourself
    if (targetRole === 'owner') return false    // can't touch owners
    if (isOwner) return true
    if (isAdminOrOwner && targetRole === 'member') return true
    return false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Members — {workspace.name}</DialogTitle>
          <DialogDescription>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto min-h-0 flex-1">
          {/* Invite form — only for owners and admins */}
          {isAdminOrOwner && (
            <div className="space-y-3 shrink-0">
              <Label>Invite by email</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setInviteError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleInvite()
                  }}
                  className="flex-1"
                />
                {/* Role selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 px-3">
                      {inviteRole === 'admin' ? (
                        <Shield className="h-3.5 w-3.5" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                      <span className="capitalize">{inviteRole}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {ROLE_OPTIONS
                      .filter((r) => isOwner || r.value !== 'admin')
                      .map((r) => (
                        <DropdownMenuItem
                          key={r.value}
                          onSelect={() => setInviteRole(r.value)}
                          className="flex flex-col items-start gap-0"
                        >
                          <div className="flex items-center gap-1.5 font-medium">
                            <r.icon className="h-3.5 w-3.5" />
                            {r.label}
                          </div>
                          <span className="text-[11px] text-muted-foreground pl-5">{r.description}</span>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  onClick={() => void handleInvite()}
                  disabled={!email.trim() || addMember.isPending}
                  className="gap-1.5 shrink-0"
                >
                  {addMember.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  Add
                </Button>
              </div>
              {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
              <Separator />
            </div>
          )}

          {/* Members list */}
          <div className="space-y-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))
            ) : (
              members.map((m) => {
                const profile = m.profiles
                const displayName = profile?.full_name ?? profile?.email ?? 'Unknown'
                const isCurrentUser = m.user_id === user?.id
                const canManage = canManageMember(m.role, m.user_id)

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
                        {generateInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">
                        {displayName}
                        {isCurrentUser && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(you)</span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate leading-tight">
                        {profile?.email ?? ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {m.role === 'owner' ? (
                        <div className="flex items-center gap-1">
                          <Crown className="h-3 w-3 text-amber-500" />
                          <MemberRoleBadge role={m.role} />
                        </div>
                      ) : (
                        <MemberRoleBadge role={m.role} />
                      )}

                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {isOwner && m.role !== 'admin' && (
                              <DropdownMenuItem
                                className="gap-2"
                                onSelect={() =>
                                  void updateRole.mutateAsync({ memberId: m.id, role: 'admin' })
                                }
                              >
                                <Shield className="h-3.5 w-3.5" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {isOwner && m.role === 'admin' && (
                              <DropdownMenuItem
                                className="gap-2"
                                onSelect={() =>
                                  void updateRole.mutateAsync({ memberId: m.id, role: 'member' })
                                }
                              >
                                <User className="h-3.5 w-3.5" />
                                Make Member
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-destructive focus:text-destructive"
                              onSelect={() => void removeMember.mutateAsync(m.id)}
                            >
                              Remove from workspace
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
