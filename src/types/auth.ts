import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  fullName: string
}

export interface ResetPasswordPayload {
  email: string
}

export interface UpdatePasswordPayload {
  password: string
}

export { type User, type Session }
