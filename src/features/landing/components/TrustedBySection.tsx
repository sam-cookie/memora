import { motion } from 'framer-motion'

const COMPANIES = ['Vantara', 'Solvexa', 'Nordova', 'Celara', 'Brightpath', 'Forenza']

const STATS = [
  { value: '50K+', label: 'Meetings processed' },
  { value: '1.2M+', label: 'Action items tracked' },
  { value: '12K+', label: 'Teams using Memora' },
]

export function TrustedBySection() {
  return (
    <section className="border-y border-border/40 bg-surface-1/50 py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mb-10 grid grid-cols-3 gap-6 sm:gap-12"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border/50" />
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
            Trusted by teams at
          </p>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* Company logos (text-based placeholders) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12"
        >
          {COMPANIES.map((name) => (
            <span
              key={name}
              className="font-display text-base font-semibold tracking-tight text-muted-foreground/35 transition-colors hover:text-muted-foreground/55 sm:text-[17px]"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
