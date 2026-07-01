import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, MailCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/common/FormField'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/auth.schemas'
import { useForgotPassword } from '../hooks/useForgotPassword'
import { ROUTES } from '@/config/routes'

export function ForgotPasswordPage() {
  const { mutate: sendReset, isPending, isSuccess } = useForgotPassword()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordFormData) => sendReset(data)

  return (
    <AnimatePresence mode="wait">
      {isSuccess ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 text-center"
        >
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 ring-1 ring-success/20">
              <MailCheck className="h-7 w-7 text-success" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">Check your inbox</h2>
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to{' '}
              <span className="font-medium text-foreground">{getValues('email')}</span>.
              The link expires in 60 minutes.
            </p>
          </div>

          <p className="text-xs text-muted-foreground/70">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => sendReset(getValues())}
              className="text-primary hover:underline"
            >
              resend
            </button>
            .
          </p>

          <Link
            to={ROUTES.login}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Forgot your password?</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

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

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full"
              loading={isPending}
            >
              {isPending ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <Link
            to={ROUTES.login}
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
