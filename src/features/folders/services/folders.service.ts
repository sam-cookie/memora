import { supabase } from '@/lib/supabase'
import type { Database, FolderColor } from '@/types/database'

type FolderInsert = Database['public']['Tables']['folders']['Insert']

export const foldersService = {
  async getFolders() {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async createFolder(name: string, color: FolderColor, userId: string) {
    const payload: FolderInsert = { name, color, user_id: userId }
    const { data, error } = await supabase
      .from('folders')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async renameFolder(id: string, name: string) {
    const { data, error } = await supabase
      .from('folders')
      .update({ name })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async updateFolderColor(id: string, color: FolderColor) {
    const { data, error } = await supabase
      .from('folders')
      .update({ color })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async deleteFolder(id: string) {
    // Meetings with this folder_id will have folder_id set to NULL by the ON DELETE SET NULL constraint
    const { error } = await supabase.from('folders').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async moveMeetingToFolder(meetingId: string, folderId: string | null) {
    const { error } = await supabase
      .from('meetings')
      .update({ folder_id: folderId })
      .eq('id', meetingId)

    if (error) throw new Error(error.message)
  },
}
