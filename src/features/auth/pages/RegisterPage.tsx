import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/common/FormField'
import { PasswordInput } from '../components/PasswordInput'
import { registerSchema, type RegisterFormData } from '../schemas/auth.schemas'
import { useRegister } from '../hooks/useRegister'
import { ROUTES } from '@/config/routes'

export function RegisterPage() {
  const { mutate: register, isPending } = useRegister()

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password', '')

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ]

  const onSubmit = (data: RegisterFormData) => register(data)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Create an account</h2>
        <p className="text-sm text-muted-foreground">
          Start your AI meeting intelligence journey
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField id="fullName" label="Full name" error={errors.fullName?.message} required>
          <Input
            id="fullName"
            type="text"
            placeholder="Jane Smith"
            autoComplete="name"
            autoFocus
            startIcon={<User className="h-4 w-4" />}
            error={!!errors.fullName}
            {...registerField('fullName')}
          />
        </FormField>

        <FormField id="email" label="Email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            startIcon={<Mail className="h-4 w-4" />}
            error={!!errors.email}
            {...registerField('email')}
          />
        </FormField>

        <div className="space-y-3">
          <FormField id="password" label="Password" error={errors.password?.message} required>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={!!errors.password}
              {...registerField('password')}
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
          label="Confirm password"
          error={errors.confirmPassword?.message}
          required
        >
          <PasswordInput
            id="confirmPassword"
            placeholder="••••••••"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            {...registerField('confirmPassword')}
          />
        </FormField>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          className="w-full"
          loading={isPending}
        >
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to={ROUTES.login}
          className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
