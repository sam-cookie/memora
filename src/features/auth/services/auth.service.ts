import { supabase } from '@/lib/supabase'
import type { LoginCredentials, RegisterCredentials, ResetPasswordPayload, UpdatePasswordPayload } from '@/types/auth'

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.'
  if (message.includes('Email not confirmed')) return 'Please confirm your email before signing in.'
  if (message.includes('User already registered')) return 'An account with this email already exists.'
  if (message.includes('Password should be')) return 'Password does not meet the minimum requirements.'
  if (message.includes('rate limit') || message.includes('too many')) return 'Too many attempts. Please wait a moment and try again.'
  if (message.includes('network')) return 'Network error. Check your connection and try again.'
  return message
}

export const authService = {
  async signIn(credentials: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    if (error) throw new Error(mapAuthError(error.message))
    return data
  },

  async signUp({ email, password, fullName }: RegisterCredentials) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw new Error(mapAuthError(error.message))
    return data
  },

  async resetPasswordForEmail({ email }: ResetPasswordPayload) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw new Error(mapAuthError(error.message))
  },

  async updatePassword({ password }: UpdatePasswordPayload) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(mapAuthError(error.message))
  },
}
