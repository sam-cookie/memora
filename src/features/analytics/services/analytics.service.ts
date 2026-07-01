import { supabase } from '@/lib/supabase'

export interface MonthPoint {
  month: string
  value: number
}

export interface ActionItemsPoint {
  month: string
  total: number
  completed: number
}

export interface StatusSlice {
  status: string
  count: number
  label: string
}

export interface ParticipantFreq {
  name: string
  meetings: number
}

export interface AnalyticsData {
  meetingsByMonth: MonthPoint[]
  actionItemsByMonth: ActionItemsPoint[]
  statusBreakdown: StatusSlice[]
  topParticipants: ParticipantFreq[]
}

function toMonthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  return new Date(`${key}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function fillMonths(map: Record<string, number>, keys: string[]): MonthPoint[] {
  return keys.map((k) => ({ month: monthLabel(k), value: map[k] ?? 0 }))
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  pending: 'Pending',
  uploading: 'Uploading',
  transcribing: 'Transcribing',
  analyzing: 'Analyzing',
  failed: 'Failed',
}

export const analyticsService = {
  async getAnalytics(): Promise<AnalyticsData> {
    const [meetingsRes, actionItemsRes] = await Promise.all([
      supabase.from('meetings').select('created_at, status, participants'),
      supabase.from('action_items').select('created_at, completed'),
    ])

    const meetings = meetingsRes.data ?? []
    const actionItems = actionItemsRes.data ?? []

    // All unique sorted month keys across both datasets
    const allKeys = [
      ...new Set([
        ...meetings.map((m) => toMonthKey(m.created_at)),
        ...actionItems.map((a) => toMonthKey(a.created_at)),
      ]),
    ].sort()

    // Meetings per month
    const meetingMonths: Record<string, number> = {}
    meetings.forEach(({ created_at }) => {
      const k = toMonthKey(created_at)
      meetingMonths[k] = (meetingMonths[k] ?? 0) + 1
    })

    // Action items per month (total + completed)
    const aiTotal: Record<string, number> = {}
    const aiDone: Record<string, number> = {}
    actionItems.forEach(({ created_at, completed }) => {
      const k = toMonthKey(created_at)
      aiTotal[k] = (aiTotal[k] ?? 0) + 1
      if (completed) aiDone[k] = (aiDone[k] ?? 0) + 1
    })

    // Status breakdown
    const statusMap: Record<string, number> = {}
    meetings.forEach(({ status }) => {
      statusMap[status] = (statusMap[status] ?? 0) + 1
    })

    // Top participants (count across all meetings)
    const participantMap: Record<string, number> = {}
    meetings.forEach(({ participants }) => {
      if (!participants) return
      ;(participants as string[]).forEach((name) => {
        participantMap[name] = (participantMap[name] ?? 0) + 1
      })
    })

    return {
      meetingsByMonth: fillMonths(meetingMonths, allKeys),

      actionItemsByMonth: allKeys.map((k) => ({
        month: monthLabel(k),
        total: aiTotal[k] ?? 0,
        completed: aiDone[k] ?? 0,
      })),

      statusBreakdown: Object.entries(statusMap)
        .map(([status, count]) => ({
          status,
          count,
          label: STATUS_LABELS[status] ?? status,
        }))
        .sort((a, b) => b.count - a.count),

      topParticipants: Object.entries(participantMap)
        .map(([name, meetings]) => ({ name, meetings }))
        .sort((a, b) => b.meetings - a.meetings)
        .slice(0, 10),
    }
  },
}
