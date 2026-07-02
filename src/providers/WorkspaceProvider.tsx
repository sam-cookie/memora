import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { workspacesService } from '@/features/workspaces/services/workspaces.service'
import type { Workspace, WorkspaceRole } from '@/types/database'

interface WorkspaceContextValue {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  /** Current user's role in the active workspace */
  activeWorkspaceRole: WorkspaceRole | null
  isLoading: boolean
  setActiveWorkspace: (workspace: Workspace) => void
  /** Helpers for role-gating UI */
  isOwner: boolean
  isAdminOrOwner: boolean
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const STORAGE_KEY = 'memora-active-workspace-id'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  )

  const { data: workspaces = [], isLoading: workspacesLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesService.getWorkspaces(),
    enabled: isAuthenticated,
  })

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: () => workspacesService.getMyMemberships(user!.id),
    enabled: !!user,
  })

  const isLoading = workspacesLoading || membershipsLoading

  // role map: workspaceId → role
  const roleMap = useMemo(() => {
    const map = new Map<string, WorkspaceRole>()
    for (const m of memberships) {
      map.set(m.workspace_id, m.role)
    }
    return map
  }, [memberships])

  const createWorkspace = useMutation({
    mutationFn: workspacesService.createWorkspace,
    onSuccess: (workspace) => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      void queryClient.invalidateQueries({ queryKey: ['my-memberships', user?.id] })
      setActiveWorkspaceId(workspace.id)
      localStorage.setItem(STORAGE_KEY, workspace.id)
    },
  })

  // Auto-create a "Personal" workspace on first login
  useEffect(() => {
    if (!isLoading && workspaces.length === 0 && user && !createWorkspace.isPending) {
      createWorkspace.mutate({
        name: 'Personal',
        description: 'Your personal workspace',
        icon: '🏠',
        color: 'blue',
        owner_id: user.id,
      })
    }
  }, [isLoading, workspaces.length, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // If stored ID points to a deleted/inaccessible workspace, fall back to first
  useEffect(() => {
    if (workspaces.length === 0) return
    if (!activeWorkspaceId || !workspaces.find((w) => w.id === activeWorkspaceId)) {
      const fallback = workspaces[0].id
      setActiveWorkspaceId(fallback)
      localStorage.setItem(STORAGE_KEY, fallback)
    }
  }, [workspaces, activeWorkspaceId])

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0] ?? null
  const activeWorkspaceRole = activeWorkspace ? (roleMap.get(activeWorkspace.id) ?? null) : null
  const isOwner = activeWorkspaceRole === 'owner'
  const isAdminOrOwner = activeWorkspaceRole === 'owner' || activeWorkspaceRole === 'admin'

  const setActiveWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id)
    localStorage.setItem(STORAGE_KEY, workspace.id)
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceRole,
        isLoading,
        setActiveWorkspace,
        isOwner,
        isAdminOrOwner,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
