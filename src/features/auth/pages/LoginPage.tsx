import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation } from 'react-router-dom'
import { Mail, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/common/FormField'
import { PasswordInput } from '../components/PasswordInput'
import { loginSchema, type LoginFormData } from '../schemas/auth.schemas'
import { useLogin } from '../hooks/useLogin'
import { ROUTES } from '@/config/routes'

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

const field = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  },
}

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
    <div>
      {/* Heading */}
      <div className="mb-7">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.018em] text-foreground">
          Welcome back
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
          Sign in to continue to your workspace
        </p>
      </div>

      {/* Email confirmation banner */}
      <AnimatePresence>
        {emailConfirmationSent && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/[0.07] px-3.5 py-3 text-[13px] text-success">
              <CheckCircle2 className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Account created! Check your email to confirm before signing in.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <motion.form
        variants={stagger}
        initial="hidden"
        animate="show"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <motion.div variants={field}>
          <FormField id="email" label="Email" error={errors.email?.message} required>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              className="h-10"
              startIcon={<Mail className="h-[15px] w-[15px]" />}
              error={!!errors.email}
              {...register('email')}
            />
          </FormField>
        </motion.div>

        <motion.div variants={field} className="mt-4">
          <FormField id="password" label="Password" error={errors.password?.message} required>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-10"
              error={!!errors.password}
              {...register('password')}
            />
          </FormField>
        </motion.div>

        <motion.div variants={field} className="mt-3 flex justify-end">
          <Link
            to={ROUTES.forgotPassword}
            className="text-[13px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Forgot password?
          </Link>
        </motion.div>

        <motion.div variants={field} className="mt-5">
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full font-semibold"
            loading={isPending}
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </motion.div>

        <motion.div variants={field} className="mt-5">
          <p className="text-center text-[13px] text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              to={ROUTES.register}
              className="font-semibold text-foreground transition-colors duration-150 hover:text-primary"
            >
              Create account
            </Link>
          </p>
        </motion.div>
      </motion.form>
    </div>
  )
}
