import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type MeetingInsert = Database['public']['Tables']['meetings']['Insert']
type MeetingUpdate = Database['public']['Tables']['meetings']['Update']

export const meetingsService = {
  async createMeeting(data: Omit<MeetingInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert(data)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return meeting
  },

  async getMeeting(id: string) {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async updateMeeting(id: string, data: MeetingUpdate) {
    const { data: meeting, error } = await supabase
      .from('meetings')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return meeting
  },

  async uploadRecording(
    userId: string,
    meetingId: string,
    file: File,
    onProgress: (percent: number) => void,
  ) {
    const ext = file.name.split('.').pop() ?? 'bin'
    const filePath = `${userId}/${meetingId}.${ext}`

    const { data, error } = await supabase.storage
      .from('meeting-recordings')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          onProgress(percent)
        },
      })

    if (error) throw new Error(error.message)
    return { ...data, filePath }
  },

  async getActionItems(meetingId: string) {
    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at')

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async toggleActionItem(id: string, completed: boolean) {
    const { error } = await supabase
      .from('action_items')
      .update({ completed })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async getDecisions(meetingId: string) {
    const { data, error } = await supabase
      .from('key_decisions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at')

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getRisks(meetingId: string) {
    const { data, error } = await supabase
      .from('risks')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at')

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getFollowUpQuestions(meetingId: string) {
    const { data, error } = await supabase
      .from('follow_up_questions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at')

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getMeetings() {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async deleteMeeting(id: string) {
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
