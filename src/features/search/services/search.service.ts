import { supabase } from '@/lib/supabase'
import type { Meeting } from '@/types/database'

export interface ActionItemResult {
  id: string
  content: string
  priority: string
  completed: boolean
  meeting_id: string
  meetingTitle: string
  meetingStatus: string
}

export interface SearchResults {
  meetings: Meeting[]
  actionItems: ActionItemResult[]
}

export const searchService = {
  async search(query: string, workspaceId?: string | null): Promise<SearchResults> {
    if (!query.trim()) return { meetings: [], actionItems: [] }

    const q = query.trim()

    let meetingsQuery = supabase
      .from('meetings')
      .select('*')
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%,transcript.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (workspaceId) meetingsQuery = meetingsQuery.eq('workspace_id', workspaceId)

    const [meetingsRes, actionItemsRes] = await Promise.all([
      meetingsQuery,
      supabase
        .from('action_items')
        .select('id, content, priority, completed, meeting_id, meetings(id, title, status, workspace_id)')
        .ilike('content', `%${q}%`)
        .limit(20),
    ])

    let actionItems: ActionItemResult[] = (actionItemsRes.data ?? []).map((row) => {
      const meeting = (row.meetings ?? {}) as { id?: string; title?: string; status?: string; workspace_id?: string }
      return {
        id: row.id as string,
        content: row.content as string,
        priority: row.priority as string,
        completed: row.completed as boolean,
        meeting_id: row.meeting_id as string,
        meetingTitle: meeting.title ?? 'Unknown meeting',
        meetingStatus: meeting.status ?? 'unknown',
      }
    })

    if (workspaceId) {
      actionItems = actionItems.filter((item) => {
        const raw = (actionItemsRes.data ?? []).find((r) => r.id === item.id)
        const meeting = raw?.meetings as { workspace_id?: string } | null
        return meeting?.workspace_id === workspaceId
      })
    }

    return {
      meetings: meetingsRes.data ?? [],
      actionItems,
    }
  },
}
