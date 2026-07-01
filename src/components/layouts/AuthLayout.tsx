import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/config/routes'
import { PageLoader } from '@/components/common/PageLoader'

export function AuthLayout() {
  const { isAuthenticated, isLoading, isRecoveryMode } = useAuth()

  if (isLoading) return <PageLoader />

  // Recovery mode: authenticated but must stay on the reset-password page
  if (isAuthenticated && !isRecoveryMode) return <Navigate to={ROUTES.dashboard} replace />

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gradient-brand">Memora</h1>
            <p className="text-sm text-muted-foreground mt-0.5">AI-powered meeting intelligence</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="glass rounded-2xl p-8 shadow-glass">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Memora. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
