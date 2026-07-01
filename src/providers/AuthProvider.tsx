import { createContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isRecoveryMode: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Tracks when a user arrives via a password-recovery link so AuthLayout
  // does not prematurely redirect them away from the reset-password page.
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setIsLoading(false)

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true)
      }

      if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        setIsRecoveryMode(false)
      }

      if (event === 'SIGNED_OUT') {
        queryClient.clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    queryClient.clear()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        isRecoveryMode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
