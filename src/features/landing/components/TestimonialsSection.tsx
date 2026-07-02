import { motion } from 'framer-motion'
import { SectionHeading } from './SectionHeading'

interface Testimonial {
  quote: string
  author: string
  role: string
  company: string
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Memora has completely changed how our engineering team captures decisions. We used to lose so much context between planning and execution. Now every call has a paper trail that anyone can search.",
    author: 'Sarah Chen',
    role: 'VP of Engineering',
    company: 'Acme Corp',
    initials: 'SC',
  },
  {
    quote:
      "The AI summaries alone save our product team 8–10 hours a week. But what really changed things was having action items automatically tied to the meeting where they were assigned. Zero follow-up slipping.",
    author: 'Marcus Rodriguez',
    role: 'Head of Product',
    company: 'Pulse Labs',
    initials: 'MR',
  },
  {
    quote:
      "As Chief of Staff, I sit in on a lot of meetings. Before Memora, my job was basically manual transcription and follow-up tracking. Now I actually have time to think.",
    author: 'Aisha Williams',
    role: 'Chief of Staff',
    company: 'Meridian',
    initials: 'AW',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
}

export function TestimonialsSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by teams who run on meetings"
        />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 gap-5 lg:grid-cols-3"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.author}
              variants={item}
              className="flex flex-col rounded-xl border border-border/50 bg-surface-1/40 p-7 transition-colors hover:border-border"
            >
              {/* Quote mark */}
              <div
                className="mb-5 font-display text-5xl leading-none text-primary/20 select-none"
                aria-hidden="true"
              >
                &ldquo;
              </div>

              <p className="flex-1 text-[14.5px] leading-relaxed text-foreground/80">
                {t.quote}
              </p>

              <div className="mt-6 flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                  <span className="font-display text-[12px] font-semibold text-primary">
                    {t.initials}
                  </span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{t.author}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
