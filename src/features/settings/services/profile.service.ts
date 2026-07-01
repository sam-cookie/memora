import { supabase } from '@/lib/supabase'

const AVATARS_BUCKET = 'avatars'
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Use a JPG, PNG, or WebP image.'
  if (file.size > MAX_AVATAR_BYTES) return 'Image must be under 5 MB.'
  return null
}

export const profileService = {
  /** Upload avatar to storage and return the public URL (cache-busted). */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}.${ext}`

    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type })

    if (error) throw new Error(error.message)

    const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
    // Bust the browser cache so the new image is displayed immediately
    return `${data.publicUrl}?t=${Date.now()}`
  },

  /** Update display name and/or avatar URL in Supabase Auth user metadata. */
  async updateProfile(updates: { fullName?: string; avatarUrl?: string }): Promise<void> {
    const data: Record<string, string> = {}
    if (updates.fullName !== undefined) data['full_name'] = updates.fullName
    if (updates.avatarUrl !== undefined) data['avatar_url'] = updates.avatarUrl

    const { error } = await supabase.auth.updateUser({ data })
    if (error) throw new Error(error.message)
  },
}
