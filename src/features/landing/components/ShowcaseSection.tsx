import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { SectionHeading } from './SectionHeading'

// Inline dark-themed UI snippets — always dark for visual consistency
function SummaryPreview() {
  const decisions = [
    'Mobile-first approach adopted for Q3 development cycle',
    'Design system freeze effective July 15th',
    'Weekly syncs moved from Mondays to Tuesdays',
  ]
  const actions = [
    { text: 'Finalize mobile design spec', owner: 'Sarah', due: 'Jul 1' },
    { text: 'Review updated accessibility checklist', owner: 'Team', due: 'Jul 5' },
  ]

  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#0F0F0F',
        overflow: 'hidden',
        boxShadow: '0 20px 60px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>Q2 Strategy Review</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Jun 28 · 47 min · 6 participants</p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(96,165,250,0.9)', background: 'rgba(96,165,250,0.1)', padding: '2px 10px', borderRadius: '999px' }}>
          Summary
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
          Key Decisions
        </p>
        {decisions.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <span style={{ marginTop: '2px', width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(96,165,250,0.7)', flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{d}</p>
          </div>
        ))}

        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', marginTop: '16px' }}>
          Action Items
        </p>
        {actions.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{a.text}</p>
            </div>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{a.owner} · {a.due}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionItemsPreview() {
  const items = [
    { text: 'Finalize mobile design spec', owner: 'Sarah K.', due: 'Jul 1', priority: 'High', done: true },
    { text: 'Update accessibility checklist', owner: 'Design Team', due: 'Jul 5', priority: 'Med', done: false },
    { text: 'Revise engineering roadmap', owner: 'Marcus R.', due: 'Jul 8', priority: 'High', done: false },
    { text: 'Schedule user research interviews', owner: 'Alex P.', due: 'Jul 10', priority: 'Low', done: false },
  ]

  const priorityColor = (p: string) => {
    if (p === 'High') return { color: 'rgba(248,113,113,0.9)', bg: 'rgba(248,113,113,0.1)' }
    if (p === 'Med') return { color: 'rgba(251,191,36,0.9)', bg: 'rgba(251,191,36,0.1)' }
    return { color: 'rgba(107,114,128,0.9)', bg: 'rgba(107,114,128,0.1)' }
  }

  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#0F0F0F',
        overflow: 'hidden',
        boxShadow: '0 20px 60px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>Action Items</p>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>11 open · 4 shown</span>
      </div>

      {/* Items */}
      <div style={{ padding: '8px' }}>
        {items.map((item, i) => {
          const pc = priorityColor(item.priority)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 8px',
                borderRadius: '6px',
                borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                opacity: item.done ? 0.45 : 1,
              }}
            >
              <div style={{
                width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                border: item.done ? 'none' : '1px solid rgba(255,255,255,0.2)',
                background: item.done ? '#2563EB' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.done && <span style={{ fontSize: '9px', color: '#fff' }}>✓</span>}
              </div>
              <p style={{ flex: 1, fontSize: '12px', color: 'rgba(255,255,255,0.75)', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.text}
              </p>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)' }}>{item.owner}</span>
              <span style={{ fontSize: '10px', fontWeight: 500, color: pc.color, background: pc.bg, padding: '1px 6px', borderRadius: '4px' }}>
                {item.priority}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ShowcaseBlock {
  eyebrow: string
  title: string
  description: string
  preview: ReactNode
  reversed?: boolean
}

function ShowcaseBlock({ eyebrow, title, description, preview, reversed }: ShowcaseBlock) {
  return (
    <div className={`flex flex-col gap-10 lg:gap-16 ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center`}>
      {/* Text */}
      <motion.div
        initial={{ opacity: 0, x: reversed ? 20 : -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1"
      >
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h3 className="mb-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h3>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      </motion.div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, x: reversed ? -20 : 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md flex-1 lg:max-w-none"
      >
        {preview}
      </motion.div>
    </div>
  )
}

export function ShowcaseSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Product"
          title="See Memora in action"
          description="Every feature designed to reduce friction and surface what matters."
        />

        <div className="space-y-24">
          <ShowcaseBlock
            eyebrow="AI Summaries"
            title="Every insight, automatically surfaced"
            description="Our AI reads through your entire meeting and extracts what matters — decisions made, context behind them, and every commitment given. No prompting, no templates."
            preview={<SummaryPreview />}
          />
          <ShowcaseBlock
            eyebrow="Action Items"
            title="Accountability that runs itself"
            description="Tasks assigned during meetings are captured automatically, linked to their source conversation, and tracked by owner and due date. Your team always knows what's theirs."
            preview={<ActionItemsPreview />}
            reversed
          />
        </div>
      </div>
    </section>
  )
}
