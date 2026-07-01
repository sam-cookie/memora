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
  async search(query: string): Promise<SearchResults> {
    if (!query.trim()) return { meetings: [], actionItems: [] }

    const q = query.trim()

    const [meetingsRes, actionItemsRes] = await Promise.all([
      supabase
        .from('meetings')
        .select('*')
        .or(`title.ilike.%${q}%,summary.ilike.%${q}%,transcript.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(20),

      supabase
        .from('action_items')
        .select('id, content, priority, completed, meeting_id, meetings(id, title, status)')
        .ilike('content', `%${q}%`)
        .limit(20),
    ])

    const actionItems: ActionItemResult[] = (actionItemsRes.data ?? []).map((row) => {
      const meeting = (row.meetings ?? {}) as { id?: string; title?: string; status?: string }
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

    return {
      meetings: meetingsRes.data ?? [],
      actionItems,
    }
  },
}
