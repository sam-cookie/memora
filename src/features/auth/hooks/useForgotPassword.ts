import { useMutation } from '@tanstack/react-query'
import { authService } from '../services/auth.service'
import { toast } from '@/components/ui/toaster'

export function useForgotPassword() {
  return useMutation({
    mutationFn: authService.resetPasswordForEmail,
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Request failed', description: error.message })
    },
  })
}
