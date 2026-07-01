import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { ROUTES } from '@/config/routes'
import { toast } from '@/components/ui/toaster'

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.signUp,
    onSuccess: (data) => {
      if (!data.session) {
        // Email confirmation is enabled — user must confirm before signing in
        navigate(ROUTES.login, { state: { emailConfirmationSent: true } })
      } else {
        // Email confirmation is disabled — immediately signed in
        navigate(ROUTES.dashboard, { replace: true })
      }
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Registration failed', description: error.message })
    },
  })
}
