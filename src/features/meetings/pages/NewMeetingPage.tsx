import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Sparkles,
} from 'lucide-react'
import { NewMeetingForm } from '../components/NewMeetingForm'

const EXTRACTIONS = [
  {
    icon: FileText,
    title: 'Executive Summary',
    description: 'Objective, key outcome, and overall meeting status at a glance.',
  },
  {
    icon: ListChecks,
    title: 'Action Items',
    description: 'Tasks with owners, priorities, due dates, and confidence scores.',
  },
  {
    icon: CheckCircle2,
    title: 'Decisions',
    description: 'Finalized agreements with rationale and business impact.',
  },
  {
    icon: AlertTriangle,
    title: 'Risks & Blockers',
    description: 'Issues flagged by severity with suggested mitigations.',
  },
  {
    icon: Lightbulb,
    title: 'AI Insights',
    description: 'Smart observations — missing owners, recurring concerns, follow-ups.',
  },
  {
    icon: Clock,
    title: 'Meeting Timeline',
    description: 'Chronological flow of key moments in the conversation.',
  },
  {
    icon: HelpCircle,
    title: 'Open Questions',
    description: 'Genuinely unanswered questions that need a follow-up.',
  },
]

const FORMATS = ['MP3', 'WAV', 'M4A', 'MP4', 'TXT']

export function NewMeetingPage() {
  return (
    <div className="flex flex-1 min-h-full">
      {/* Form column — fills remaining space, content capped at 2xl for readability */}
      <div className="flex-1 min-w-0 overflow-y-auto p-[clamp(1.5rem,5vw,3rem)] space-y-6">
        <div className="max-w-2xl space-y-6">
          <div>
            <h1 className="text-xl font-semibold">New Meeting</h1>
            <p className="text-sm text-muted-foreground">Upload a recording or transcript</p>
          </div>
          <NewMeetingForm />
        </div>
      </div>

      {/* Right panel — proportional width, collapses on narrow viewports */}
      <aside className="hidden lg:flex flex-col shrink-0 w-[clamp(260px,28%,420px)] border-l border-border p-[clamp(1.5rem,3vw,2.5rem)] gap-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">What Memora extracts</p>
            <p className="text-xs text-muted-foreground">From every recording or transcript</p>
          </div>
        </div>

        {/* Extraction list */}
        <div className="space-y-2">
          {EXTRACTIONS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-3 rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card"
            >
              <Icon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">{title}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Supported formats */}
        <div className="mt-auto space-y-3">
          <div className="rounded-lg border border-border bg-card/50 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Supported formats
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FORMATS.map((fmt) => (
                <span
                  key={fmt}
                  className="font-mono text-xs px-2 py-0.5 rounded-md bg-surface-2 text-muted-foreground"
                >
                  {fmt}
                </span>
              ))}
              <span className="text-xs px-2 py-0.5 text-muted-foreground/60">max 25 MB</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed px-2">
            Clear audio or a full transcript gives the best AI analysis.
          </p>
        </div>
      </aside>
    </div>
  )
}
