import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/common/FormField'
import { PasswordInput } from '../components/PasswordInput'
import { loginSchema, type LoginFormData } from '../schemas/auth.schemas'
import { useLogin } from '../hooks/useLogin'
import { ROUTES } from '@/config/routes'

export function LoginPage() {
  const { mutate: login, isPending } = useLogin()
  const location = useLocation()
  const emailConfirmationSent = (location.state as { emailConfirmationSent?: boolean } | null)
    ?.emailConfirmationSent

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => login(data)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <AnimatePresence>
        {emailConfirmationSent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success"
          >
            Account created! Check your email to confirm before signing in.
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField id="email" label="Email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            startIcon={<Mail className="h-4 w-4" />}
            error={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField id="password" label="Password" error={errors.password?.message} required>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <div className="flex items-center justify-end">
          <Link
            to={ROUTES.forgotPassword}
            className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="brand" size="lg" className="w-full" loading={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.register}
          className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
        >
          Create account
        </Link>
      </p>
    </div>
  )
}
