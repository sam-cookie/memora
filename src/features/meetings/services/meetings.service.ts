import { supabase } from '@/lib/supabase'
import type { Database, MeetingContactWithContact } from '@/types/database'

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
      })

    if (error) throw new Error(error.message)
    onProgress(100)
    return { ...data, filePath }
  },

  async getSignedUrl(filePath: string, expiresIn = 300): Promise<string> {
    const { data, error } = await supabase.storage
      .from('meeting-recordings')
      .createSignedUrl(filePath, expiresIn)
    if (error) throw new Error(error.message)
    return data.signedUrl
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

  async getMeetings(workspaceId?: string | null) {
    let query = supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })

    if (workspaceId) {
      // Include both meetings in this workspace AND orphaned ones (workspace_id IS NULL)
      // so meetings created before workspace association aren't lost
      query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async deleteMeeting(id: string) {
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async getMeetingContacts(meetingId: string): Promise<MeetingContactWithContact[]> {
    const { data, error } = await supabase
      .from('meeting_contacts')
      .select('*, contact:contacts(*)')
      .eq('meeting_id', meetingId)
      .order('created_at')

    if (error) throw new Error(error.message)
    return (data ?? []) as MeetingContactWithContact[]
  },

  async setMeetingContacts(meetingId: string, contactIds: string[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('meeting_contacts')
      .delete()
      .eq('meeting_id', meetingId)

    if (deleteError) throw new Error(deleteError.message)

    if (contactIds.length === 0) return

    const { error: insertError } = await supabase.from('meeting_contacts').insert(
      contactIds.map((contact_id) => ({ meeting_id: meetingId, contact_id })),
    )

    if (insertError) throw new Error(insertError.message)
  },
}
