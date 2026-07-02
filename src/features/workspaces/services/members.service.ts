import { supabase } from '@/lib/supabase'
import type { WorkspaceRole } from '@/types/database'

export interface WorkspaceMemberProfile {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  invited_by: string | null
  created_at: string
  profiles: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

export const membersService = {
  async getMembers(workspaceId: string): Promise<WorkspaceMemberProfile[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*, profiles(id, full_name, email, avatar_url)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as WorkspaceMemberProfile[]
  },

  async addMemberByEmail(
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
    invitedBy: string,
  ): Promise<void> {
    // Look up the user in profiles by email
    const { data: profile, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (lookupError || !profile) {
      throw new Error('No account found with that email address.')
    }

    const { error } = await supabase.from('workspace_members').insert({
      workspace_id: workspaceId,
      user_id: profile.id,
      role,
      invited_by: invitedBy,
    })

    if (error) {
      if (error.code === '23505') throw new Error('This person is already a member.')
      throw new Error(error.message)
    }
  },

  async updateRole(memberId: string, role: WorkspaceRole): Promise<void> {
    const { error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('id', memberId)

    if (error) throw new Error(error.message)
  },

  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)

    if (error) throw new Error(error.message)
  },
}
