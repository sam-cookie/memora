import { Outlet, Navigate, useLocation, Link } from 'react-router-dom'
import memoraLogo from '@/assets/memora.png'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/config/routes'
import { PageLoader } from '@/components/common/PageLoader'

const POINTS = [
  'Transcribe any recording in minutes',
  'Extract decisions, actions, and risks automatically',
  'Search across every meeting your team has ever had',
]

export function AuthLayout() {
  const { isAuthenticated, isLoading, isRecoveryMode } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader />

  if (isAuthenticated && !isRecoveryMode && location.pathname !== ROUTES.resetPassword) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">

        {/* LEFT: Minimal editorial panel */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:flex lg:w-[52%] xl:w-[54%] flex-col justify-between border-r border-border/40 p-12 xl:p-16"
          aria-hidden="true"
        >
          {/* Logo — links back to home */}
          <Link to={ROUTES.home} className="flex items-center gap-2.5 transition-opacity hover:opacity-70">
            <img src={memoraLogo} alt="Memora" className="h-7 w-7" />
            <span className="font-display text-[15px] font-semibold tracking-tight">Memora</span>
          </Link>

          {/* Main copy */}
          <div className="max-w-[400px]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 className="mb-5 font-display text-[2.25rem] xl:text-[2.5rem] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
                Turn every meeting into organized knowledge.
              </h1>
              <p className="mb-10 text-[15px] leading-[1.7] text-muted-foreground">
                Memora transcribes your recordings and extracts what matters — so your team never loses a decision or drops a task.
              </p>

              <ul className="space-y-3">
                {POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-[13.5px] text-muted-foreground">
                    <span className="mt-[5px] h-1 w-4 shrink-0 rounded-full bg-border" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <p className="text-[11px] text-muted-foreground/35">
            &copy; {new Date().getFullYear()} Memora &middot; All rights reserved
          </p>
        </motion.aside>

        {/* RIGHT: Auth form */}
        <div className="flex w-full lg:w-[48%] xl:w-[46%] items-center justify-center px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-[390px]">
            {/* Mobile header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="mb-8 flex flex-col items-center gap-2.5 lg:hidden"
            >
              <Link
                to={ROUTES.home}
                className="mb-2 flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                Back to home
              </Link>
              <img src={memoraLogo} alt="Memora" className="h-9 w-9" />
              <span className="font-display text-base font-semibold tracking-tight">Memora</span>
            </motion.div>

            {/* Auth card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.07, ease: [0.4, 0, 0.2, 1] }}
              className="auth-card-glass p-8 sm:p-9"
            >
              <Outlet />
            </motion.div>

            <p className="mt-5 text-center text-[11px] text-muted-foreground/35 lg:hidden">
              &copy; {new Date().getFullYear()} Memora &middot; All rights reserved
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
