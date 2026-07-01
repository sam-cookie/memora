import { supabase } from '@/lib/supabase'
import type { Meeting } from '@/types/database'

export interface DashboardStats {
  totalMeetings: number
  completedMeetings: number
  processingMeetings: number
  totalActionItems: number
  openActionItems: number
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [total, completed, processing, actionItems, openTasks] = await Promise.all([
      supabase.from('meetings').select('*', { count: 'exact', head: true }),
      supabase.from('meetings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('meetings').select('*', { count: 'exact', head: true }).in('status', [
        'pending', 'uploading', 'transcribing', 'analyzing',
      ]),
      supabase.from('action_items').select('*', { count: 'exact', head: true }),
      supabase.from('action_items').select('*', { count: 'exact', head: true }).eq('completed', false),
    ])

    return {
      totalMeetings: total.count ?? 0,
      completedMeetings: completed.count ?? 0,
      processingMeetings: processing.count ?? 0,
      totalActionItems: actionItems.count ?? 0,
      openActionItems: openTasks.count ?? 0,
    }
  },

  async getRecentMeetings(): Promise<Meeting[]> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw new Error(error.message)
    return data ?? []
  },
}
