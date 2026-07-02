import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/common/FormField'
import { PasswordInput } from '../components/PasswordInput'
import { PageLoader } from '@/components/common/PageLoader'
import { resetPasswordSchema, type ResetPasswordFormData } from '../schemas/auth.schemas'
import { useResetPassword } from '../hooks/useResetPassword'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/config/routes'

export function ResetPasswordPage() {
  const { isRecoveryMode } = useAuth()
  const { mutate: resetPassword, isPending } = useResetPassword()

  // PKCE flow: the URL contains a `code` param that Supabase exchanges
  // asynchronously. Show a loader while waiting for the PASSWORD_RECOVERY event
  // instead of flashing "Link expired". Fall back to the error state after 8s
  // in case the code is invalid and the event never fires.
  const [awaitingRecovery, setAwaitingRecovery] = useState(
    () => !isRecoveryMode && new URLSearchParams(window.location.search).has('code'),
  )

  useEffect(() => {
    if (!awaitingRecovery) return
    if (isRecoveryMode) {
      setAwaitingRecovery(false)
      return
    }
    const timeout = setTimeout(() => setAwaitingRecovery(false), 8000)
    return () => clearTimeout(timeout)
  }, [isRecoveryMode, awaitingRecovery])

  if (awaitingRecovery) return <PageLoader />

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password', '')

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ]

  const onSubmit = (data: ResetPasswordFormData) => resetPassword({ password: data.password })

  if (!isRecoveryMode) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold">Link expired or invalid</h2>
          <p className="text-sm text-muted-foreground">
            This link is no longer valid. Password reset links expire after 60 minutes and can only
            be used once.
          </p>
        </div>

        <Link
          to={ROUTES.forgotPassword}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Set new password</h2>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-3">
          <FormField id="password" label="New password" error={errors.password?.message} required>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="new-password"
              autoFocus
              error={!!errors.password}
              {...register('password')}
            />
          </FormField>

          {password.length > 0 && (
            <ul className="space-y-1" role="list" aria-label="Password requirements">
              {requirements.map((req) => (
                <li
                  key={req.label}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    req.met ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                      req.met ? 'bg-success' : 'bg-muted-foreground/40'
                    }`}
                    aria-hidden="true"
                  />
                  {req.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <FormField
          id="confirmPassword"
          label="Confirm new password"
          error={errors.confirmPassword?.message}
          required
        >
          <PasswordInput
            id="confirmPassword"
            placeholder="••••••••"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          className="w-full"
          loading={isPending}
        >
          {isPending ? 'Updating password…' : 'Update password'}
        </Button>
      </form>
    </div>
  )
}
