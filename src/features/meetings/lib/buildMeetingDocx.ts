import {
  BorderStyle,
  Document,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type {
  Meeting,
  ActionItem,
  KeyDecision,
  Risk,
  FollowUpQuestion,
  ActionItemPriority,
  RiskSeverity,
} from '@/types/database'
import type { MeetingAnalysis, MeetingOverallStatus } from '@/features/ai/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuildDocxArgs {
  meeting: Meeting
  actionItems: ActionItem[]
  decisions: KeyDecision[]
  risks: Risk[]
  questions: FollowUpQuestion[]
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  ink: '111827',
  secondary: '374151',
  muted: '6B7280',
  faint: '9CA3AF',
  faintest: 'D1D5DB',
  border: 'E5E7EB',
  surface: 'F3F4F6',
  slate: '1E293B',
  green: '16A34A',
  amber: 'D97706',
  red: 'DC2626',
  orange: 'EA580C',
}

const STATUS_COLOR: Record<MeetingOverallStatus, string> = {
  'on-track': C.green,
  'at-risk': C.amber,
  blocked: C.red,
}

const STATUS_LABEL: Record<MeetingOverallStatus, string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  blocked: 'Blocked',
}

const PRIORITY_COLOR: Record<ActionItemPriority, string> = {
  critical: C.red,
  high: C.orange,
  medium: C.muted,
  low: C.faint,
}

const SEV_COLOR: Record<RiskSeverity, string> = {
  critical: C.red,
  high: C.orange,
  medium: C.amber,
  low: C.muted,
}

const INSIGHT_LABEL: Record<string, string> = {
  'missing-owner': 'Missing Owner',
  'missing-deadline': 'Missing Deadline',
  'repeated-concern': 'Repeated Concern',
  'project-risk': 'Project Risk',
  'unresolved-item': 'Unresolved Item',
  'follow-up-needed': 'Follow-up Needed',
  'discussion-distribution': 'Discussion Distribution',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

function getAiAnalysis(meeting: Meeting): MeetingAnalysis | null {
  if (!meeting.ai_analysis) return null
  return meeting.ai_analysis as unknown as MeetingAnalysis
}

// ─── Border presets ───────────────────────────────────────────────────────────

const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: 'auto' } as const
const BORDER_LIGHT = { style: BorderStyle.SINGLE, size: 4, color: C.border } as const
const BORDER_MEDIUM = { style: BorderStyle.SINGLE, size: 8, color: C.faint } as const

const CELL_BORDERS_NONE = { top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE }
const CELL_BORDERS_ROW = { top: BORDER_NONE, bottom: BORDER_LIGHT, left: BORDER_NONE, right: BORDER_NONE }
const CELL_BORDERS_HEADER = { top: BORDER_NONE, bottom: BORDER_MEDIUM, left: BORDER_NONE, right: BORDER_NONE }

// ─── Paragraph builders ───────────────────────────────────────────────────────
// Typographic hierarchy:
//   Level 1 (section headings): 10pt bold, secondary, ALLCAPS + letter-spacing
//   Level 2 (item headings): 12pt bold, ink
//   Level 3 (body text): 11pt regular, ink
//   Labels (property keys): 8pt bold, muted, ALLCAPS

type DocxChild = Paragraph | Table

function sectionHeading(title: string, count?: number): Paragraph {
  return new Paragraph({
    children: [
      // Level 1: 10pt bold secondary — dark enough to read, differentiated via ALLCAPS
      new TextRun({ text: title, size: 20, bold: true, color: C.secondary, allCaps: true, characterSpacing: 40 }),
      ...(count !== undefined
        ? [new TextRun({ text: `  (${count})`, size: 18, color: C.muted })]
        : []),
    ],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.faintest, space: 1 } },
    spacing: { before: 440, after: 200 },
  })
}

function bodyParagraph(text: string, color = C.ink, spacingAfter = 100): Paragraph {
  return new Paragraph({
    // Level 3: 11pt body text, defaults to ink
    children: [new TextRun({ text, size: 22, color })],
    spacing: { after: spacingAfter },
  })
}

function fieldParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      // Label: 8pt bold muted — readable but clearly subordinate
      new TextRun({ text: label.toUpperCase() + '  ', size: 16, bold: true, color: C.muted, allCaps: true }),
      // Value: 10pt ink
      new TextRun({ text: value, size: 20, color: C.ink }),
    ],
    spacing: { after: 100 },
  })
}

function quoteParagraph(text: string): Paragraph {
  return new Paragraph({
    // Quote context: 10pt secondary with left border
    children: [new TextRun({ text, size: 20, color: C.secondary })],
    indent: { left: 220 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.faintest, space: 7 } },
    spacing: { after: 80 },
  })
}

// ─── Action items table ───────────────────────────────────────────────────────

function makeHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: C.surface, fill: C.surface },
    borders: CELL_BORDERS_HEADER,
    children: [
      new Paragraph({
        children: [
          // Table column headers: 8pt bold secondary ALLCAPS
          new TextRun({ text: text.toUpperCase(), size: 16, bold: true, color: C.secondary, allCaps: true }),
        ],
        spacing: { before: 80, after: 80 },
      }),
    ],
  })
}

function makeBodyCell(children: Paragraph[], width: number, last = false): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: last ? CELL_BORDERS_NONE : CELL_BORDERS_ROW,
    children,
  })
}

function premiumActionItemsTable(aiItems: MeetingAnalysis['actionItems'], dbItems: ActionItem[]): Table {
  const W = [5, 44, 21, 15, 15]

  const headerRow = new TableRow({
    children: [
      makeHeaderCell('', W[0]),
      makeHeaderCell('Task', W[1]),
      makeHeaderCell('Owner', W[2]),
      makeHeaderCell('Priority', W[3]),
      makeHeaderCell('Due', W[4]),
    ],
  })

  const dataRows = aiItems.map((item, i) => {
    const completed = dbItems[i]?.completed ?? false
    const isLast = i === aiItems.length - 1

    const taskCells: Paragraph[] = [
      new Paragraph({
        children: [
          // Task text: 11pt, ink or muted when done
          new TextRun({ text: item.content, size: 22, color: completed ? C.muted : C.ink, strike: completed }),
        ],
        spacing: { before: 60, after: item.confidence !== 'high' ? 20 : 60 },
      }),
    ]
    if (item.confidence !== 'high') {
      taskCells.push(
        new Paragraph({
          children: [new TextRun({ text: item.confidence === 'medium' ? 'inferred' : 'estimated', size: 16, color: C.muted })],
          spacing: { before: 0, after: 60 },
        }),
      )
    }

    return new TableRow({
      children: [
        makeBodyCell([
          new Paragraph({
            children: [new TextRun({ text: completed ? '☑' : '☐', size: 20, color: completed ? C.secondary : C.muted })],
            spacing: { before: 60, after: 60 },
          }),
        ], W[0], isLast),
        makeBodyCell(taskCells, W[1], isLast),
        makeBodyCell([
          new Paragraph({
            children: [new TextRun({ text: item.assignee ?? '—', size: 20, color: C.secondary })],
            spacing: { before: 60, after: 60 },
          }),
        ], W[2], isLast),
        makeBodyCell([
          new Paragraph({
            children: [new TextRun({ text: capitalize(item.priority), size: 16, bold: true, color: PRIORITY_COLOR[item.priority], allCaps: true })],
            spacing: { before: 60, after: 60 },
          }),
        ], W[3], isLast),
        makeBodyCell([
          new Paragraph({
            children: [new TextRun({ text: item.dueDate ? formatShortDate(item.dueDate) : '—', size: 20, color: C.secondary })],
            spacing: { before: 60, after: 60 },
          }),
        ], W[4], isLast),
      ],
    })
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: { top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE, insideHorizontal: BORDER_NONE, insideVertical: BORDER_NONE },
  })
}

function legacyActionItemsTable(items: ActionItem[]): Table {
  const W = [5, 52, 25, 18]

  const headerRow = new TableRow({
    children: [
      makeHeaderCell('', W[0]),
      makeHeaderCell('Task', W[1]),
      makeHeaderCell('Owner', W[2]),
      makeHeaderCell('Priority', W[3]),
    ],
  })

  const dataRows = items.map((item, i) => {
    const isLast = i === items.length - 1
    const borders = isLast ? CELL_BORDERS_NONE : CELL_BORDERS_ROW
    return new TableRow({
      children: [
        new TableCell({
          width: { size: W[0], type: WidthType.PERCENTAGE },
          borders,
          children: [new Paragraph({ children: [new TextRun({ text: item.completed ? '☑' : '☐', size: 20, color: item.completed ? C.secondary : C.muted })], spacing: { before: 60, after: 60 } })],
        }),
        new TableCell({
          width: { size: W[1], type: WidthType.PERCENTAGE },
          borders,
          children: [new Paragraph({ children: [new TextRun({ text: item.content, size: 22, color: item.completed ? C.muted : C.ink, strike: item.completed })], spacing: { before: 60, after: 60 } })],
        }),
        new TableCell({
          width: { size: W[2], type: WidthType.PERCENTAGE },
          borders,
          children: [new Paragraph({ children: [new TextRun({ text: item.assignee ?? '—', size: 20, color: C.secondary })], spacing: { before: 60, after: 60 } })],
        }),
        new TableCell({
          width: { size: W[3], type: WidthType.PERCENTAGE },
          borders,
          children: [new Paragraph({ children: [new TextRun({ text: capitalize(item.priority), size: 16, bold: true, color: PRIORITY_COLOR[item.priority], allCaps: true })], spacing: { before: 60, after: 60 } })],
        }),
      ],
    })
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: { top: BORDER_NONE, bottom: BORDER_NONE, left: BORDER_NONE, right: BORDER_NONE, insideHorizontal: BORDER_NONE, insideVertical: BORDER_NONE },
  })
}

// ─── Document header ──────────────────────────────────────────────────────────

function buildDocumentHeader(
  meeting: Meeting,
  extraMeta: TextRun[] = [],
): Paragraph[] {
  const displayDate = meeting.processed_at ?? meeting.created_at
  const metaRuns: TextRun[] = [
    new TextRun({ text: formatDate(displayDate), size: 18, color: C.secondary }),
  ]
  if (meeting.duration_seconds) {
    metaRuns.push(
      new TextRun({ text: '  ·  ', size: 18, color: C.faint }),
      new TextRun({ text: formatDuration(meeting.duration_seconds) ?? '', size: 18, color: C.secondary }),
    )
  }
  if (meeting.participants?.length) {
    metaRuns.push(
      new TextRun({ text: '  ·  ', size: 18, color: C.faint }),
      new TextRun({ text: meeting.participants.join(', '), size: 18, color: C.secondary }),
    )
  }
  metaRuns.push(...extraMeta)

  return [
    new Paragraph({
      children: [new TextRun({ text: 'MEMORA', size: 14, bold: true, color: C.faint, allCaps: true, characterSpacing: 60 })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: meeting.title, size: 44, bold: true, color: C.slate })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: metaRuns,
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.faintest, space: 1 } },
      spacing: { after: 440 },
    }),
  ]
}

// ─── Premium document ─────────────────────────────────────────────────────────

function buildPremiumChildren(
  meeting: Meeting,
  actionItems: ActionItem[],
  ai: MeetingAnalysis,
): DocxChild[] {
  const status = ai.executiveSummary.status
  const done = actionItems.filter((i) => i.completed).length
  const total = ai.actionItems.length
  const children: DocxChild[] = []

  // Header with status
  children.push(...buildDocumentHeader(meeting, [
    new TextRun({ text: '  ·  ', size: 18, color: C.faint }),
    new TextRun({ text: STATUS_LABEL[status], size: 18, bold: true, color: STATUS_COLOR[status] }),
  ]))

  // Executive Summary
  children.push(
    sectionHeading('Executive Summary'),
    fieldParagraph('Objective', ai.executiveSummary.objective),
    fieldParagraph('Key Outcome', ai.executiveSummary.keyOutcome),
    bodyParagraph(ai.executiveSummary.paragraph, C.secondary),
  )

  // Discussion Topics
  if (ai.discussionTopics.length > 0) {
    children.push(sectionHeading('Discussion Topics', ai.discussionTopics.length))
    for (const topic of ai.discussionTopics) {
      children.push(
        new Paragraph({
          // Level 2 heading: 12pt bold ink
          children: [new TextRun({ text: topic.topic, size: 24, bold: true, color: C.ink })],
          spacing: { before: 100, after: 80 },
        }),
        ...topic.points.map((point) =>
          new Paragraph({
            children: [
              new TextRun({ text: '–  ', size: 20, color: C.muted }),
              new TextRun({ text: point, size: 20, color: C.ink }),
            ],
            indent: { left: 200 },
            spacing: { after: 60 },
          })
        ),
      )
    }
  }

  // Action Items
  if (ai.actionItems.length > 0) {
    children.push(sectionHeading('Action Items', ai.actionItems.length))
    children.push(premiumActionItemsTable(ai.actionItems, actionItems))
    children.push(new Paragraph({ spacing: { after: 140 } }))
  }

  // Decisions
  if (ai.decisions.length > 0) {
    children.push(sectionHeading('Decisions', ai.decisions.length))
    ai.decisions.forEach((d, i) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}.  `, size: 20, color: C.muted }),
            // Level 2: 12pt bold ink
            new TextRun({ text: d.content, size: 24, bold: true, color: C.ink }),
          ],
          spacing: { before: 100, after: 60 },
        }),
      )
      if (d.context) children.push(quoteParagraph(d.context))
      if (d.impact) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: d.impact, size: 18, color: C.muted })],
            indent: { left: 220 },
            spacing: { after: 100 },
          }),
        )
      }
    })
  }

  // Risks & Blockers
  if (ai.risks.length > 0) {
    children.push(sectionHeading('Risks & Blockers', ai.risks.length))
    for (const r of ai.risks) {
      children.push(
        new Paragraph({
          children: [
            // Level 2: 12pt bold ink
            new TextRun({ text: r.content, size: 24, bold: true, color: C.ink }),
            new TextRun({ text: '   ' }),
            new TextRun({ text: capitalize(r.severity), size: 16, bold: true, color: SEV_COLOR[r.severity], allCaps: true }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        new Paragraph({
          children: [
            // Property labels: 8pt bold muted
            ...(r.impact ? [
              new TextRun({ text: 'Impact  ', size: 16, bold: true, color: C.muted, allCaps: true }),
              new TextRun({ text: r.impact + '    ', size: 20, color: C.secondary }),
            ] : []),
            new TextRun({ text: 'Likelihood  ', size: 16, bold: true, color: C.muted, allCaps: true }),
            new TextRun({ text: capitalize(r.likelihood), size: 20, color: C.secondary }),
          ],
          spacing: { after: 60 },
        }),
      )
      if (r.mitigation) children.push(quoteParagraph(r.mitigation))
    }
  }

  // Open Questions
  if (ai.openQuestions.length > 0) {
    children.push(sectionHeading('Open Questions', ai.openQuestions.length))
    ai.openQuestions.forEach((q, i) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}.  `, size: 20, color: C.muted }),
            new TextRun({ text: q, size: 22, color: C.ink }),
          ],
          spacing: { after: 100 },
        }),
      )
    })
  }

  // AI Insights
  if (ai.aiInsights.length > 0) {
    children.push(sectionHeading('AI Insights', ai.aiInsights.length))
    for (const insight of ai.aiInsights) {
      children.push(
        new Paragraph({
          // Property label: 8pt bold muted
          children: [new TextRun({ text: (INSIGHT_LABEL[insight.type] ?? insight.type).toUpperCase(), size: 16, bold: true, color: C.muted, allCaps: true })],
          spacing: { before: 100, after: 40 },
        }),
        bodyParagraph(insight.content, C.ink, 100),
      )
    }
  }

  // Meeting Timeline
  if (ai.timeline.length > 0) {
    children.push(sectionHeading('Meeting Timeline', ai.timeline.length))
    for (const event of ai.timeline) {
      children.push(
        new Paragraph({
          children: [
            // Timeline label: 8pt bold muted
            new TextRun({ text: event.moment.toUpperCase() + '  ', size: 16, bold: true, color: C.muted, allCaps: true }),
            new TextRun({ text: event.description, size: 20, color: C.ink }),
          ],
          spacing: { after: 80 },
        }),
      )
    }
  }

  // Progress Summary
  if (total > 0) {
    children.push(
      sectionHeading('Progress Summary'),
      new Paragraph({
        children: [
          new TextRun({ text: String(done), size: 32, bold: true, color: C.ink }),
          new TextRun({ text: '  Completed    ', size: 20, color: C.secondary }),
          new TextRun({ text: String(total - done), size: 32, bold: true, color: C.ink }),
          new TextRun({ text: '  Pending    ', size: 20, color: C.secondary }),
          new TextRun({ text: String(total), size: 32, bold: true, color: C.ink }),
          new TextRun({ text: '  Total', size: 20, color: C.secondary }),
        ],
        spacing: { after: 140 },
      }),
    )
  }

  return children
}

// ─── Legacy document ──────────────────────────────────────────────────────────

function buildLegacyChildren(
  meeting: Meeting,
  actionItems: ActionItem[],
  decisions: KeyDecision[],
  risks: Risk[],
  questions: FollowUpQuestion[],
): DocxChild[] {
  const children: DocxChild[] = []

  children.push(...buildDocumentHeader(meeting))

  if (meeting.summary) {
    children.push(sectionHeading('Summary'), bodyParagraph(meeting.summary, C.secondary))
  }

  if (meeting.key_points?.length) {
    children.push(sectionHeading('Key Points', meeting.key_points.length))
    for (const point of meeting.key_points) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '–  ', size: 20, color: C.muted }),
            new TextRun({ text: point, size: 20, color: C.ink }),
          ],
          spacing: { after: 80 },
        }),
      )
    }
  }

  if (actionItems.length > 0) {
    children.push(sectionHeading('Action Items', actionItems.length))
    children.push(legacyActionItemsTable(actionItems))
    children.push(new Paragraph({ spacing: { after: 140 } }))
  }

  if (decisions.length > 0) {
    children.push(sectionHeading('Decisions', decisions.length))
    decisions.forEach((d, i) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}.  `, size: 20, color: C.muted }),
            new TextRun({ text: d.content, size: 24, bold: true, color: C.ink }),
          ],
          spacing: { before: 100, after: 60 },
        }),
      )
      if (d.context) children.push(quoteParagraph(d.context))
    })
  }

  if (risks.length > 0) {
    children.push(sectionHeading('Risks & Blockers', risks.length))
    for (const r of risks) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: r.content, size: 24, bold: true, color: C.ink }),
            new TextRun({ text: '   ' }),
            new TextRun({ text: capitalize(r.severity), size: 16, bold: true, color: SEV_COLOR[r.severity], allCaps: true }),
          ],
          spacing: { before: 100, after: 100 },
        }),
      )
    }
  }

  if (questions.length > 0) {
    children.push(sectionHeading('Open Questions', questions.length))
    questions.forEach((q, i) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}.  `, size: 20, color: C.muted }),
            new TextRun({ text: q.question, size: 22, color: C.ink }),
          ],
          spacing: { after: 100 },
        }),
      )
    })
  }

  return children
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildMeetingDocx(args: BuildDocxArgs): Document {
  const { meeting, actionItems, decisions, risks, questions } = args
  const ai = getAiAnalysis(meeting)

  const children = ai
    ? buildPremiumChildren(meeting, actionItems, ai)
    : buildLegacyChildren(meeting, actionItems, decisions, risks, questions)

  return new Document({
    creator: 'Memora',
    title: meeting.title,
    description: 'Meeting notes generated by Memora',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children,
      },
    ],
  })
}
