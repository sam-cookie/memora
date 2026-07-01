import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { ROUTES } from '@/config/routes'
import { toast } from '@/components/ui/toaster'

export function useLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? ROUTES.dashboard

  return useMutation({
    mutationFn: authService.signIn,
    onSuccess: () => {
      navigate(from, { replace: true })
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Sign in failed', description: error.message })
    },
  })
}
