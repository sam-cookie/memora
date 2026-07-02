import { supabase } from '@/lib/supabase'
import type { WorkspaceColor, WorkspaceRole } from '@/types/database'

export const workspacesService = {
  async getWorkspaces() {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async createWorkspace(payload: {
    name: string
    description?: string | null
    icon?: string | null
    color?: WorkspaceColor
    owner_id: string
  }) {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        name: payload.name,
        description: payload.description ?? null,
        icon: payload.icon ?? null,
        color: payload.color ?? 'blue',
        owner_id: payload.owner_id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Add the creator as owner in workspace_members.
    // Ignore 23505 (unique violation) — a DB trigger may have already inserted this row.
    const { error: memberError } = await supabase.from('workspace_members').insert({
      workspace_id: data.id,
      user_id: payload.owner_id,
      role: 'owner' as WorkspaceRole,
    })

    if (memberError && memberError.code !== '23505') {
      throw new Error(memberError.message)
    }

    return data
  },

  async updateWorkspace(
    id: string,
    payload: {
      name?: string
      description?: string | null
      icon?: string | null
      color?: WorkspaceColor
    },
  ) {
    const { data, error } = await supabase
      .from('workspaces')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async deleteWorkspace(id: string) {
    const { error } = await supabase.from('workspaces').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async getMyMemberships(userId: string): Promise<{ workspace_id: string; role: WorkspaceRole }[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    return (data ?? []) as { workspace_id: string; role: WorkspaceRole }[]
  },
}
