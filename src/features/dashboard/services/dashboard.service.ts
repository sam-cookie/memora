import { supabase } from '@/lib/supabase'
import type { Meeting, ActionItem } from '@/types/database'

export interface DashboardStats {
  totalMeetings: number
  completedMeetings: number
  processingMeetings: number
  totalActionItems: number
  openActionItems: number
  participantCount: number
}

export interface ActionItemWithMeeting extends ActionItem {
  meetings: { id: string; title: string } | null
}

export interface RecentDecision {
  id: string
  content: string
  context: string | null
  created_at: string
  meetings: { id: string; title: string; created_at: string } | null
}

export const dashboardService = {
  async getStats(workspaceId?: string | null): Promise<DashboardStats> {
    const meetingBase = () => {
      const q = supabase.from('meetings').select('*', { count: 'exact', head: true })
      return workspaceId ? q.eq('workspace_id', workspaceId) : q
    }

    // Use !inner so workspace filter excludes action items whose meeting is in another workspace
    const actionItemBase = () => {
      if (workspaceId) {
        return supabase
          .from('action_items')
          .select('*, meetings!inner(workspace_id)', { count: 'exact', head: true })
          .eq('meetings.workspace_id', workspaceId)
      }
      return supabase.from('action_items').select('*', { count: 'exact', head: true })
    }

    const contactsQuery = workspaceId
      ? supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('archived', false)
      : Promise.resolve({ count: 0 } as { count: number | null })

    const [total, completed, processing, actionItems, openTasks, contacts] = await Promise.all([
      meetingBase(),
      meetingBase().eq('status', 'completed'),
      meetingBase().in('status', ['pending', 'uploading', 'transcribing', 'analyzing']),
      actionItemBase(),
      actionItemBase().eq('completed', false),
      contactsQuery,
    ])

    return {
      totalMeetings: total.count ?? 0,
      completedMeetings: completed.count ?? 0,
      processingMeetings: processing.count ?? 0,
      totalActionItems: actionItems.count ?? 0,
      openActionItems: openTasks.count ?? 0,
      participantCount: contacts.count ?? 0,
    }
  },

  async getRecentMeetings(workspaceId?: string | null): Promise<Meeting[]> {
    let query = supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (workspaceId) query = query.eq('workspace_id', workspaceId)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getActionItemsWithMeetings(workspaceId?: string | null): Promise<ActionItemWithMeeting[]> {
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

  async getOpenActionItemsWithMeetings(workspaceId?: string | null): Promise<ActionItemWithMeeting[]> {
    const joinType = workspaceId ? 'meetings!inner' : 'meetings'
    let query = supabase
      .from('action_items')
      .select(`*, ${joinType}(id, title, workspace_id)`)
      .eq('completed', false)
      .order('created_at', { ascending: false })

    if (workspaceId) query = query.eq('meetings.workspace_id', workspaceId)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []) as ActionItemWithMeeting[]
  },

  async getRecentDecisions(workspaceId?: string | null): Promise<RecentDecision[]> {
    const joinType = workspaceId ? 'meetings!inner' : 'meetings'
    let query = supabase
      .from('key_decisions')
      .select(`id, content, context, created_at, ${joinType}(id, title, created_at, workspace_id)`)
      .order('created_at', { ascending: false })
      .limit(4)

    if (workspaceId) query = query.eq('meetings.workspace_id', workspaceId)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as RecentDecision[]
  },
}
