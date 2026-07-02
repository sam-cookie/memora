import { motion } from 'framer-motion'
import { SectionHeading } from './SectionHeading'

interface Feature {
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    title: 'AI Transcription',
    description: 'Upload any audio or video recording and get an accurate transcript in minutes.',
  },
  {
    title: 'Smart Summaries',
    description: 'Key points, decisions, and context automatically extracted from every meeting.',
  },
  {
    title: 'Action Item Tracking',
    description: 'Tasks assigned during meetings are captured and tracked until completion.',
  },
  {
    title: 'Knowledge Search',
    description: 'Full-text search across every meeting, transcript, and summary in your workspace.',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Meeting frequency, duration, and participation trends across your organization.',
  },
  {
    title: 'Team Workspaces',
    description: 'Organize meetings by project, team, or client with shared access controls.',
  },
  {
    title: 'Calendar View',
    description: 'A chronological view of your entire meeting history for quick navigation.',
  },
  {
    title: 'Participant Tracking',
    description: "Understand who's involved in which conversations and decisions over time.",
  },
  {
    title: 'PDF Export',
    description: 'Share polished, formatted meeting notes with any stakeholder in one click.',
  },
  {
    title: 'Command Palette',
    description: 'Navigate your entire meeting history with ⌘K — faster than any sidebar.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything your team needs"
          description="From raw recording to structured knowledge — every step automated so you can focus on what was actually decided."
        />

        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {FEATURES.map((feature) => (
            <motion.li key={feature.title} variants={item}>
              <div className="group h-full border border-border/50 p-6 transition-all duration-200 hover:border-border hover:bg-surface-1/50 first:rounded-tl-xl last:rounded-br-xl sm:first:rounded-tl-none sm:last:rounded-br-none [&:nth-child(1)]:rounded-tl-xl [&:nth-child(2)]:rounded-tr-none [&:nth-child(2n)]:sm:rounded-tr-none [&:nth-last-child(1)]:rounded-br-xl [&:nth-last-child(2)]:rounded-bl-none">
                <h3 className="mb-2 text-[14px] font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
