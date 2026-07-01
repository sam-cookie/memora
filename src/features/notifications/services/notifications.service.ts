import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/config/routes'

export type NotificationType =
  | 'meeting_completed'
  | 'meeting_processing'
  | 'task_completed'
  | 'task_overdue'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: string
  href: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const notificationsService = {
  async getAll(): Promise<Notification[]> {
    const [completedRes, processingRes, completedTasksRes, urgentRes] = await Promise.all([
      // Recent completed meetings
      supabase
        .from('meetings')
        .select('id, title, processed_at')
        .eq('status', 'completed')
        .not('processed_at', 'is', null)
        .order('processed_at', { ascending: false })
        .limit(5),

      // Currently processing meetings
      supabase
        .from('meetings')
        .select('id, title, created_at, status')
        .in('status', ['pending', 'uploading', 'transcribing', 'analyzing'])
        .order('created_at', { ascending: false })
        .limit(3),

      // Recently completed action items
      supabase
        .from('action_items')
        .select('id, content, updated_at, meetings(title)')
        .eq('completed', true)
        .order('updated_at', { ascending: false })
        .limit(4),

      // High priority open tasks
      supabase
        .from('action_items')
        .select('id, content, created_at, priority, meetings(title)')
        .eq('completed', false)
        .in('priority', ['high', 'critical'])
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    const items: Notification[] = []

    // Completed meetings
    for (const m of completedRes.data ?? []) {
      items.push({
        id: `meeting_done_${m.id}`,
        type: 'meeting_completed',
        title: 'Meeting ready',
        description: m.title,
        timestamp: m.processed_at as string,
        href: ROUTES.meeting(m.id),
      })
    }

    // Processing meetings
    for (const m of processingRes.data ?? []) {
      const statusLabel: Record<string, string> = {
        pending: 'Queued for processing',
        uploading: 'Uploading',
        transcribing: 'Transcribing audio',
        analyzing: 'Generating insights',
      }
      items.push({
        id: `meeting_proc_${m.id}`,
        type: 'meeting_processing',
        title: statusLabel[m.status as string] ?? 'Processing',
        description: m.title,
        timestamp: m.created_at,
        href: ROUTES.meeting(m.id),
      })
    }

    // Completed action items
    for (const t of (completedTasksRes.data ?? []) as Array<{
      id: string
      content: string
      updated_at: string
      meetings: { title: string } | null
    }>) {
      items.push({
        id: `task_done_${t.id}`,
        type: 'task_completed',
        title: 'Task completed',
        description: t.content.length > 60 ? `${t.content.slice(0, 60)}…` : t.content,
        timestamp: t.updated_at,
        href: ROUTES.actionItems,
      })
    }

    // Urgent open tasks
    for (const t of (urgentRes.data ?? []) as Array<{
      id: string
      content: string
      created_at: string
      priority: string
      meetings: { title: string } | null
    }>) {
      items.push({
        id: `task_urgent_${t.id}`,
        type: 'task_overdue',
        title: `${t.priority === 'critical' ? 'Critical' : 'High priority'} task`,
        description: t.content.length > 60 ? `${t.content.slice(0, 60)}…` : t.content,
        timestamp: t.created_at,
        href: ROUTES.actionItems,
      })
    }

    // Sort by most recent first
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return items.map((item) => ({
      ...item,
      timestamp: timeAgo(item.timestamp),
    }))
  },
}
