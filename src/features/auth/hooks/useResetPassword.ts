import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { ROUTES } from '@/config/routes'
import { toast } from '@/components/ui/toaster'

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.updatePassword,
    onSuccess: () => {
      toast({ variant: 'success', title: 'Password updated', description: 'Your password has been changed. Please sign in.' })
      navigate(ROUTES.login, { replace: true })
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Reset failed', description: error.message })
    },
  })
}
