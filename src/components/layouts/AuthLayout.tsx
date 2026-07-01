import { Outlet, Navigate } from 'react-router-dom'
import memoraLogo from '@/assets/memora.png'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/config/routes'
import { PageLoader } from '@/components/common/PageLoader'

export function AuthLayout() {
  const { isAuthenticated, isLoading, isRecoveryMode } = useAuth()

  if (isLoading) return <PageLoader />

  if (isAuthenticated && !isRecoveryMode) return <Navigate to={ROUTES.dashboard} replace />

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-1 p-4">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-primary/4 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={memoraLogo} alt="Memora" className="h-14 w-14" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Memora</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your meeting workspace</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="bg-card rounded-2xl p-8 border border-border shadow-card-lg">
          <Outlet />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Memora. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
