import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

export function FinalCTASection() {
  return (
    <section className="bg-surface-1/30 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Get started today
          </p>
          <h2 className="mb-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Start capturing every insight
          </h2>
          <p className="mb-8 text-[16px] leading-relaxed text-muted-foreground">
            Join thousands of teams who've stopped losing knowledge after every meeting.
            Free to start, no credit card required.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={ROUTES.register}>
              <Button variant="brand" size="lg" className="w-full font-semibold sm:w-auto">
                Get started for free
              </Button>
            </Link>
            <Link to={ROUTES.login}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Log in
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-muted-foreground/50">
            Free plan available · No credit card required · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}
