import { supabase } from '@/lib/supabase'
import type { ActionItem } from '@/types/database'

export interface ActionItemWithMeeting extends ActionItem {
  meetings: { id: string; title: string } | null
}

export const actionItemsService = {
  async getAll(workspaceId?: string | null): Promise<ActionItemWithMeeting[]> {
    const joinType = workspaceId ? 'meetings!inner' : 'meetings'
    let query = supabase
      .from('action_items')
      .select(`*, ${joinType}(id, title, workspace_id)`)
      .order('created_at', { ascending: false })

    if (workspaceId) query = query.eq('meetings.workspace_id', workspaceId)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []) as ActionItemWithMeeting[]
  },

  async toggle(id: string, completed: boolean) {
    const { error } = await supabase
      .from('action_items')
      .update({ completed })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}
