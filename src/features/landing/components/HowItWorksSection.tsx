import { motion } from 'framer-motion'
import { SectionHeading } from './SectionHeading'

const STEPS = [
  {
    number: '01',
    title: 'Upload your meeting',
    description:
      'Paste a transcript, drop an audio file, or connect your recording from any platform. Memora handles any format.',
  },
  {
    number: '02',
    title: 'AI processes everything',
    description:
      'Transcription, summarization, action item extraction, risk identification — fully automated in minutes.',
  },
  {
    number: '03',
    title: 'Search and collaborate',
    description:
      'Find any insight instantly, assign tasks to teammates, and share polished notes with stakeholders.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-surface-1/30 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From recording to insight in minutes"
          description="Three steps. No configuration. No manual work."
        />

        <div className="relative">
          {/* Connecting line — desktop only */}
          <div
            className="absolute left-0 right-0 top-[28px] hidden h-px lg:block"
            style={{
              background:
                'linear-gradient(to right, transparent, hsl(var(--border)) 15%, hsl(var(--border)) 85%, transparent)',
            }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-start"
              >
                {/* Step number bubble */}
                <div className="relative mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                  <span className="font-display text-[13px] font-bold text-muted-foreground">
                    {step.number}
                  </span>
                  {/* Active dot on desktop when first */}
                  {i === 0 && (
                    <span className="absolute -right-px -top-px h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                  )}
                </div>

                <h3 className="mb-2.5 font-display text-[17px] font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
