import { motion } from 'framer-motion'
import { SectionHeading } from './SectionHeading'

const BENEFITS = [
  {
    stat: '3×',
    label: 'faster recaps',
    description:
      'Meeting notes that used to take 30 minutes to write now take seconds. Your team gets summaries before anyone leaves the call.',
  },
  {
    stat: '0',
    label: 'missed commitments',
    description:
      'Every action item is captured, attributed, and tracked. Nothing falls through because it was never written down.',
  },
  {
    stat: '100%',
    label: 'searchable history',
    description:
      'Every word from every meeting, indexed and searchable. Find any decision or context in seconds — not hours.',
  },
  {
    stat: '1',
    label: 'source of truth',
    description:
      'All meeting knowledge lives in one place. No scattered notes, no lost Slack messages, no "who decided that?" again.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
}

export function BenefitsSection() {
  return (
    <section className="bg-surface-1/30 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Why Memora"
          title="The cost of poor meeting memory is real"
          description="Teams spend hours recapping meetings, lose decisions in chat threads, and forget who owns what. Memora solves all of it."
        />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {BENEFITS.map((benefit) => (
            <motion.div
              key={benefit.label}
              variants={item}
              className="rounded-xl border border-border/50 bg-background p-7 transition-colors hover:border-border"
            >
              <div className="mb-4 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-foreground">
                  {benefit.stat}
                </span>
                <span className="text-sm font-medium text-muted-foreground">{benefit.label}</span>
              </div>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
