import { supabase } from '@/lib/supabase'
import type { ActionItem } from '@/types/database'

export interface ActionItemWithMeeting extends ActionItem {
  meetings: { id: string; title: string } | null
}

export const actionItemsService = {
  async getAll(): Promise<ActionItemWithMeeting[]> {
    const { data, error } = await supabase
      .from('action_items')
      .select('*, meetings(id, title)')
      .order('created_at', { ascending: false })

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
