import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { profileService } from '../services/profile.service'

interface UpdateProfileInput {
  fullName: string
  avatarFile?: File
}

export function useUpdateProfile() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ fullName, avatarFile }: UpdateProfileInput) => {
      let avatarUrl: string | undefined

      if (avatarFile && user) {
        avatarUrl = await profileService.uploadAvatar(user.id, avatarFile)
      }

      await profileService.updateProfile({ fullName, avatarUrl })
    },
  })
}
