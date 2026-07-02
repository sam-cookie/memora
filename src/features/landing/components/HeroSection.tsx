import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DashboardMockup } from './DashboardMockup'
import { ROUTES } from '@/config/routes'

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.014]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        {/* Text content — centered */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
            className="mb-5 font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-foreground sm:text-5xl lg:text-[3.5rem]"
          >
            Turn every meeting into
            <br className="hidden sm:block" />
            {' '}
            <span className="text-gradient">actionable knowledge</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="mx-auto mb-8 max-w-[520px] text-[17px] leading-relaxed text-muted-foreground"
          >
            Memora transcribes your recordings, extracts insights with AI, and keeps your
            team aligned — without a minute of manual work.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.26 }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to={ROUTES.register}>
              <Button variant="brand" size="lg" className="w-full font-semibold sm:w-auto">
                Get started for free
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => scrollTo('how-it-works')}
            >
              See how it works
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.38 }}
            className="mt-3 text-xs text-muted-foreground/50"
          >
            No credit card required · Free plan available · Cancel anytime
          </motion.p>
        </motion.div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="mt-16 sm:mt-20"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  )
}
