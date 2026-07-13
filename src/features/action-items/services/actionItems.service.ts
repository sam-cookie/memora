import { supabase } from '@/lib/supabase'
import type { ActionItem, ActionItemPriority } from '@/types/database'

export interface ActionItemWithMeeting extends ActionItem {
  meetings: { id: string; title: string } | null
}

export interface CreateActionItemData {
  meeting_id: string
  content: string
  assignee?: string
  priority?: ActionItemPriority
  due_date?: string
}

export interface UpdateActionItemData {
  content?: string
  assignee?: string | null
  priority?: ActionItemPriority
  due_date?: string | null
  completed?: boolean
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

  async create(data: CreateActionItemData): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('action_items')
      .insert({
        meeting_id: data.meeting_id,
        user_id: user.id,
        content: data.content,
        assignee: data.assignee ?? null,
        priority: data.priority ?? 'medium',
        due_date: data.due_date || null,
        completed: false,
      })

    if (error) throw new Error(error.message)
  },

  async update(id: string, data: UpdateActionItemData): Promise<void> {
    const sanitized = {
      ...data,
      due_date: data.due_date === '' ? null : data.due_date,
      assignee: data.assignee === '' ? null : data.assignee,
    }
    const { error } = await supabase
      .from('action_items')
      .update(sanitized)
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('action_items')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}
