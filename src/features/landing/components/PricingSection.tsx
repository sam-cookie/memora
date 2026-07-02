import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionHeading } from './SectionHeading'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

interface PricingTier {
  name: string
  monthlyPrice: number
  yearlyPrice: number
  description: string
  features: string[]
  cta: string
  highlighted: boolean
  ctaRoute: string
}

const TIERS: PricingTier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'For individuals getting started.',
    features: [
      '5 meetings per month',
      'AI summaries and transcripts',
      'Action item extraction',
      '1 workspace',
      '30-day history',
    ],
    cta: 'Get started',
    highlighted: false,
    ctaRoute: ROUTES.register,
  },
  {
    name: 'Pro',
    monthlyPrice: 19,
    yearlyPrice: 15,
    description: 'For professionals who run on meetings.',
    features: [
      'Unlimited meetings',
      'Full AI suite — summaries, decisions, risks',
      'Action item tracking and assignment',
      'Full-text search',
      '5 workspaces',
      'PDF export',
      'Priority support',
    ],
    cta: 'Start free trial',
    highlighted: true,
    ctaRoute: ROUTES.register,
  },
  {
    name: 'Team',
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: 'For teams that need shared knowledge.',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Shared workspaces and permissions',
      'Analytics dashboard',
      'Admin controls',
      'SSO and SAML support',
      'Dedicated onboarding',
    ],
    cta: 'Contact sales',
    highlighted: false,
    ctaRoute: ROUTES.login,
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
}

export function PricingSection() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="bg-surface-1/30 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          description="No hidden fees. No per-seat surprises. Start free and upgrade when you're ready."
        />

        {/* Billing toggle */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <span className={cn('text-sm', !yearly ? 'text-foreground' : 'text-muted-foreground')}>
            Monthly
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle annual billing"
            className={cn(
              'relative h-6 w-11 rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              yearly
                ? 'border-primary bg-primary'
                : 'border-border bg-muted',
            )}
          >
            <span
              className={cn(
                'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                yearly ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
          <span className={cn('text-sm', yearly ? 'text-foreground' : 'text-muted-foreground')}>
            Yearly
          </span>
          <motion.span
            initial={false}
            animate={yearly ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18 }}
            className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
          >
            Save 20%
          </motion.span>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start"
        >
          {TIERS.map((tier) => {
            const price = tier.monthlyPrice === 0
              ? '$0'
              : `$${yearly ? tier.yearlyPrice : tier.monthlyPrice}`

            return (
              <motion.div
                key={tier.name}
                variants={item}
                className={cn(
                  'relative flex flex-col rounded-xl border p-7',
                  tier.highlighted
                    ? 'border-border bg-card shadow-md lg:scale-[1.025] lg:shadow-lg'
                    : 'border-border/50 bg-background hover:border-border',
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-foreground">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {tier.name}
                  </p>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold tracking-tight text-foreground">
                      {price}
                    </span>
                    {tier.monthlyPrice > 0 && (
                      <span className="text-[13px] text-muted-foreground">/mo</span>
                    )}
                  </div>
                  <p className="mb-3 text-[12px] text-muted-foreground/60">
                    {tier.monthlyPrice === 0
                      ? 'Free forever'
                      : yearly
                        ? `Billed $${tier.yearlyPrice * 12}/yr`
                        : 'Billed monthly'}
                  </p>
                  <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                    {tier.description}
                  </p>
                </div>

                <ul className="mb-7 flex-1 space-y-3" role="list">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className="mt-[1px] h-3.5 w-3.5 shrink-0 text-primary"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      <span className="text-[13.5px] text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to={tier.ctaRoute}>
                  <Button
                    variant={tier.highlighted ? 'brand' : 'outline'}
                    size="default"
                    className={cn('w-full', tier.highlighted && 'font-semibold')}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center text-[13px] text-muted-foreground/60"
        >
          All plans include a 14-day free trial. No credit card required.
        </motion.p>
      </div>
    </section>
  )
}
