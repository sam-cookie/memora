import { supabase } from '@/lib/supabase'
import type { Contact, Meeting, ActionItem, KeyDecision } from '@/types/database'

export interface ContactMeeting extends Pick<Meeting, 'id' | 'title' | 'meeting_date' | 'status' | 'duration_seconds' | 'workspace_id'> {}
export interface ContactActionItem extends Pick<ActionItem, 'id' | 'content' | 'assignee' | 'completed' | 'priority' | 'due_date'> {
  meeting: Pick<Meeting, 'id' | 'title' | 'meeting_date'>
}
export interface ContactDecision extends Pick<KeyDecision, 'id' | 'content' | 'context'> {
  meeting: Pick<Meeting, 'id' | 'title' | 'meeting_date'>
}

export interface GetContactsOptions {
  workspaceId: string
  includeArchived?: boolean
  search?: string
}

export const participantsService = {
  async getContacts({ workspaceId, includeArchived = false, search }: GetContactsOptions): Promise<Contact[]> {
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true })

    if (!includeArchived) {
      query = query.eq('archived', false)
    }

    if (search?.trim()) {
      const q = search.trim()
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async createContact(payload: {
    workspace_id: string
    name: string
    email?: string | null
    company?: string | null
    notes?: string | null
  }): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        workspace_id: payload.workspace_id,
        name: payload.name,
        email: payload.email ?? null,
        company: payload.company ?? null,
        notes: payload.notes ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async updateContact(
    id: string,
    payload: {
      name?: string
      email?: string | null
      company?: string | null
      notes?: string | null
    },
  ): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async setArchived(id: string, archived: boolean): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .update({ archived })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async getContact(id: string): Promise<Contact> {
    const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data
  },

  async getContactMeetings(contactId: string): Promise<ContactMeeting[]> {
    const { data, error } = await supabase
      .from('meeting_contacts')
      .select('meeting:meetings(id, title, meeting_date, status, duration_seconds, workspace_id)')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return ((data ?? []).map((r) => r.meeting).filter(Boolean)) as ContactMeeting[]
  },

  async getContactActionItems(meetingIds: string[], contactName: string): Promise<ContactActionItem[]> {
    if (meetingIds.length === 0) return []
    const { data, error } = await supabase
      .from('action_items')
      .select('id, content, assignee, completed, priority, due_date, meeting:meetings!inner(id, title, meeting_date)')
      .in('meeting_id', meetingIds)
      .ilike('assignee', `%${contactName}%`)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as ContactActionItem[]
  },

  async getContactDecisions(meetingIds: string[], contactName: string): Promise<ContactDecision[]> {
    if (meetingIds.length === 0) return []
    const { data, error } = await supabase
      .from('key_decisions')
      .select('id, content, context, meeting:meetings!inner(id, title, meeting_date)')
      .in('meeting_id', meetingIds)
      .ilike('content', `%${contactName}%`)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as ContactDecision[]
  },
}
