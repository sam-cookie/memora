import type { ReactNode } from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
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

export interface MeetingPDFProps {
  meeting: Meeting
  actionItems: ActionItem[]
  decisions: KeyDecision[]
  risks: Risk[]
  questions: FollowUpQuestion[]
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
// 90% grayscale document; blue reserved for cover, section icons, key accents.

const T = {
  // Text
  ink: '#111827',
  secondary: '#374151',
  muted: '#6B7280',
  faint: '#9CA3AF',

  // Surfaces
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',

  // Brand (accent only)
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  blueMid: '#BFDBFE',

  // Priority badges (only colored elements in body)
  prioHigh: { bg: '#FEE2E2', text: '#DC2626' },
  prioMed: { bg: '#FEF3C7', text: '#B45309' },
  prioLow: { bg: '#F3F4F6', text: '#6B7280' },

  // Status (on cover/exec summary)
  statusGreen: '#059669',
  statusAmber: '#D97706',
  statusRed: '#DC2626',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: T.ink,
    backgroundColor: T.white,
    paddingBottom: 42,
  },

  // ── Cover header ──────────────────────────────────────────────────
  cover: {
    backgroundColor: T.blue,
    paddingTop: 28,
    paddingBottom: 20,
    paddingLeft: 48,
    paddingRight: 48,
    marginBottom: 18,
  },
  coverBrand: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: T.white,
    lineHeight: 1.25,
    marginBottom: 10,
  },
  coverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 0,
  },
  coverMetaText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.65)',
  },
  coverMetaSep: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.3)',
    marginLeft: 6,
    marginRight: 6,
  },

  // ── Body ──────────────────────────────────────────────────────────
  body: {
    paddingLeft: 48,
    paddingRight: 48,
  },

  // ── Section wrapper ───────────────────────────────────────────────
  section: {
    marginBottom: 14,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: T.secondary,
  },
  sectionCount: {
    fontSize: 7.5,
    color: T.faint,
  },
  sectionRule: {
    borderTopWidth: 0.5,
    borderTopColor: T.gray200,
    marginBottom: 8,
  },

  // ── Executive Summary (focal point) ──────────────────────────────
  execBox: {
    borderWidth: 0.75,
    borderColor: T.blueMid,
    borderRadius: 4,
    backgroundColor: T.blueLight,
    marginBottom: 14,
    overflow: 'hidden',
  },
  execHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: T.blue,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 12,
    paddingRight: 12,
  },
  execHeadLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: T.white,
    letterSpacing: 0.3,
  },
  execBody: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
  },
  execGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  execCell: { flex: 1 },
  execCellLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  execCellValue: {
    fontSize: 8.5,
    color: T.ink,
    lineHeight: 1.5,
  },
  execRule: {
    borderTopWidth: 0.5,
    borderTopColor: T.blueMid,
    marginTop: 4,
    marginBottom: 8,
  },
  execPara: {
    fontSize: 9,
    color: T.ink,
    lineHeight: 1.65,
  },

  // ── Status badge ──────────────────────────────────────────────────
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: T.white,
  },

  // ── Discussion topics ─────────────────────────────────────────────
  topicBlock: {
    marginBottom: 7,
  },
  topicTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: T.ink,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 10,
    fontSize: 9,
    color: T.faint,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: T.secondary,
    lineHeight: 1.45,
  },

  // ── Action items table ────────────────────────────────────────────
  tableOuter: {
    borderWidth: 0.5,
    borderColor: T.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.gray100,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: T.gray200,
  },
  tableHeadText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: T.gray100,
  },
  tableRowAlt: {
    backgroundColor: T.gray50,
  },
  colCheck: { width: 14, flexShrink: 0 },
  colTask: { flex: 1, paddingRight: 6 },
  colOwner: { width: 72, paddingRight: 4, flexShrink: 0 },
  colPriority: { width: 50, flexShrink: 0 },
  colDue: { width: 46, flexShrink: 0 },

  checkBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: T.gray300,
    borderRadius: 2,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: {
    backgroundColor: T.blue,
    borderColor: T.blue,
  },
  checkMark: {
    fontSize: 6.5,
    color: T.white,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  taskText: {
    fontSize: 9,
    color: T.ink,
    lineHeight: 1.4,
  },
  taskTextDone: {
    color: T.faint,
  },
  colText: {
    fontSize: 8.5,
    color: T.muted,
    lineHeight: 1.4,
  },
  inferredTag: {
    fontSize: 7,
    color: T.faint,
  },

  priorityBadge: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },

  // ── Decisions (numbered list) ─────────────────────────────────────
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  decisionNumBox: {
    width: 16,
    height: 14,
    backgroundColor: T.blueLight,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  decisionNumText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: T.blue,
  },
  decisionBody: { flex: 1 },
  decisionText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: T.ink,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  decisionMeta: {
    fontSize: 8,
    color: T.muted,
    lineHeight: 1.45,
    marginBottom: 1.5,
  },
  decisionImpact: {
    fontSize: 7.5,
    color: T.blue,
    lineHeight: 1.4,
  },

  // ── Risks (two-column grid) ───────────────────────────────────────
  riskPair: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  riskCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: T.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  riskCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: T.gray50,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: T.gray200,
  },
  riskTitle: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: T.ink,
    lineHeight: 1.35,
    marginRight: 6,
  },
  riskBody: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
  },
  riskFieldLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: T.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  riskFieldValue: {
    fontSize: 8,
    color: T.secondary,
    lineHeight: 1.4,
    marginBottom: 5,
  },
  riskSevBadge: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },

  // ── Open questions ────────────────────────────────────────────────
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  questionNum: {
    width: 20,
    fontSize: 9,
    color: T.faint,
    flexShrink: 0,
  },
  questionText: {
    flex: 1,
    fontSize: 9,
    color: T.secondary,
    lineHeight: 1.5,
  },

  // ── AI Insights ───────────────────────────────────────────────────
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  insightDot: {
    fontSize: 9,
    color: T.faint,
    marginRight: 6,
    marginTop: 0.5,
    width: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 9,
    color: T.secondary,
    lineHeight: 1.5,
  },

  // ── Timeline ──────────────────────────────────────────────────────
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  timelineDotWrap: {
    width: 16,
    alignItems: 'center',
    flexShrink: 0,
    marginRight: 8,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.blue,
    marginTop: 2,
  },
  timelineContent: { flex: 1 },
  timelineMoment: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: T.ink,
    marginBottom: 1,
  },
  timelineDesc: {
    fontSize: 8.5,
    color: T.muted,
    lineHeight: 1.45,
  },

  // ── Progress stats ────────────────────────────────────────────────
  progressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  progressCell: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: T.gray50,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: T.gray200,
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 7,
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },

  // ── Legacy key points ─────────────────────────────────────────────
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  keyPointDot: {
    width: 10,
    fontSize: 9,
    color: T.faint,
  },
  keyPointText: {
    flex: 1,
    fontSize: 9,
    color: T.secondary,
    lineHeight: 1.5,
  },

  // ── Footer (fixed) ────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: T.gray200,
  },
  footerText: {
    fontSize: 7.5,
    color: T.faint,
  },
})

// ─── Color maps ───────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<ActionItemPriority, { bg: string; text: string }> = {
  critical: T.prioHigh,
  high: T.prioHigh,
  medium: T.prioMed,
  low: T.prioLow,
}

const SEV_COLOR: Record<RiskSeverity, { bg: string; text: string }> = {
  critical: T.prioHigh,
  high: T.prioHigh,
  medium: T.prioMed,
  low: T.prioLow,
}

const STATUS_DOT: Record<MeetingOverallStatus, string> = {
  'on-track': T.statusGreen,
  'at-risk': T.statusAmber,
  blocked: T.statusRed,
}

const STATUS_LABEL: Record<MeetingOverallStatus, string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  blocked: 'Blocked',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
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

// ─── Primitives ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MeetingOverallStatus }) {
  return (
    <View style={s.statusBadge}>
      <View style={[s.statusDot, { backgroundColor: STATUS_DOT[status] }]} />
      <Text style={s.statusText}>{STATUS_LABEL[status]}</Text>
    </View>
  )
}

function PriorityBadge({ priority }: { priority: ActionItemPriority }) {
  const c = PRIORITY_COLOR[priority]
  return (
    <Text style={[s.priorityBadge, { backgroundColor: c.bg, color: c.text }]}>
      {capitalize(priority)}
    </Text>
  )
}

function SevBadge({ severity }: { severity: RiskSeverity }) {
  const c = SEV_COLOR[severity]
  return (
    <Text style={[s.riskSevBadge, { backgroundColor: c.bg, color: c.text }]}>
      {capitalize(severity)}
    </Text>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: ReactNode
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        {count !== undefined && (
          <Text style={s.sectionCount}>{count}</Text>
        )}
      </View>
      <View style={s.sectionRule} />
      {children}
    </View>
  )
}

// ─── Premium document (when ai_analysis is present) ──────────────────────────

function PremiumDocument({
  meeting,
  actionItems,
  ai,
}: {
  meeting: Meeting
  actionItems: ActionItem[]
  ai: MeetingAnalysis
}) {
  const displayDate = meeting.processed_at ?? meeting.created_at
  const done = actionItems.filter((i) => i.completed).length
  const total = ai.actionItems.length

  // Split risks into two-column pairs
  const riskPairs: (typeof ai.risks)[] = []
  for (let i = 0; i < ai.risks.length; i += 2) {
    riskPairs.push(ai.risks.slice(i, i + 2))
  }

  return (
    <Page size="A4" style={s.page}>
      {/* ── Cover ── */}
      <View style={s.cover}>
        <Text style={s.coverBrand}>MEMORA</Text>
        <Text style={s.coverTitle}>{meeting.title}</Text>
        <View style={s.coverMeta}>
          <Text style={s.coverMetaText}>{formatDate(displayDate)}</Text>
          {meeting.duration_seconds && (
            <>
              <Text style={s.coverMetaSep}>·</Text>
              <Text style={s.coverMetaText}>{formatDuration(meeting.duration_seconds)}</Text>
            </>
          )}
          {meeting.participants && meeting.participants.length > 0 && (
            <>
              <Text style={s.coverMetaSep}>·</Text>
              <Text style={s.coverMetaText}>{meeting.participants.join(', ')}</Text>
            </>
          )}
          <Text style={s.coverMetaSep}>·</Text>
          <StatusBadge status={ai.executiveSummary.status} />
        </View>
      </View>

      {/* ── Body ── */}
      <View style={s.body}>

        {/* Executive Summary */}
        <View style={s.execBox}>
          <View style={s.execHead}>
            <Text style={s.execHeadLabel}>Executive Summary</Text>
            <StatusBadge status={ai.executiveSummary.status} />
          </View>
          <View style={s.execBody}>
            <View style={s.execGrid}>
              <View style={s.execCell}>
                <Text style={s.execCellLabel}>Objective</Text>
                <Text style={s.execCellValue}>{ai.executiveSummary.objective}</Text>
              </View>
              <View style={s.execCell}>
                <Text style={s.execCellLabel}>Key Outcome</Text>
                <Text style={s.execCellValue}>{ai.executiveSummary.keyOutcome}</Text>
              </View>
            </View>
            <View style={s.execRule} />
            <Text style={s.execPara}>{ai.executiveSummary.paragraph}</Text>
          </View>
        </View>

        {/* Discussion Topics */}
        {ai.discussionTopics.length > 0 && (
          <Section title="Discussion Topics" count={ai.discussionTopics.length}>
            {ai.discussionTopics.map((topic, i) => (
              <View key={i} style={s.topicBlock}>
                <Text style={s.topicTitle}>{topic.topic}</Text>
                {topic.points.map((point, j) => (
                  <View key={j} style={s.bulletRow}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Section>
        )}

        {/* Action Items — table layout */}
        {ai.actionItems.length > 0 && (
          <Section title="Action Items" count={ai.actionItems.length}>
            <View style={s.tableOuter}>
              {/* Header */}
              <View style={s.tableHead}>
                <View style={s.colCheck} />
                <View style={s.colTask}>
                  <Text style={s.tableHeadText}>Task</Text>
                </View>
                <View style={s.colOwner}>
                  <Text style={s.tableHeadText}>Owner</Text>
                </View>
                <View style={s.colPriority}>
                  <Text style={s.tableHeadText}>Priority</Text>
                </View>
                <View style={s.colDue}>
                  <Text style={s.tableHeadText}>Due</Text>
                </View>
              </View>

              {/* Rows */}
              {ai.actionItems.map((item, i) => {
                const dbItem = actionItems[i]
                const completed = dbItem?.completed ?? false
                return (
                  <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <View style={s.colCheck}>
                      <View style={[s.checkBox, completed ? s.checkBoxDone : {}]}>
                        {completed ? <Text style={s.checkMark}>✓</Text> : null}
                      </View>
                    </View>
                    <View style={s.colTask}>
                      <Text style={[s.taskText, completed ? s.taskTextDone : {}]}>
                        {item.content}
                      </Text>
                      {item.confidence !== 'high' && (
                        <Text style={s.inferredTag}>
                          {item.confidence === 'medium' ? '~ inferred' : '~ estimated'}
                        </Text>
                      )}
                    </View>
                    <View style={s.colOwner}>
                      <Text style={s.colText}>{item.assignee ?? '—'}</Text>
                    </View>
                    <View style={s.colPriority}>
                      <PriorityBadge priority={item.priority} />
                    </View>
                    <View style={s.colDue}>
                      <Text style={s.colText}>
                        {item.dueDate ? formatShortDate(item.dueDate) : '—'}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </Section>
        )}

        {/* Decisions — numbered list */}
        {ai.decisions.length > 0 && (
          <Section title="Decisions" count={ai.decisions.length}>
            {ai.decisions.map((d, i) => (
              <View key={i} style={s.decisionRow}>
                <View style={s.decisionNumBox}>
                  <Text style={s.decisionNumText}>{i + 1}</Text>
                </View>
                <View style={s.decisionBody}>
                  <Text style={s.decisionText}>{d.content}</Text>
                  {d.context ? (
                    <Text style={s.decisionMeta}>{d.context}</Text>
                  ) : null}
                  {d.impact ? (
                    <Text style={s.decisionImpact}>↗ {d.impact}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Risks — two-column grid */}
        {ai.risks.length > 0 && (
          <Section title="Risks & Blockers" count={ai.risks.length}>
            {riskPairs.map((pair, pi) => (
              <View key={pi} style={s.riskPair}>
                {pair.map((r, ri) => (
                  <View key={ri} style={s.riskCard}>
                    <View style={s.riskCardHead}>
                      <Text style={s.riskTitle}>{r.content}</Text>
                      <SevBadge severity={r.severity} />
                    </View>
                    <View style={s.riskBody}>
                      {r.impact ? (
                        <>
                          <Text style={s.riskFieldLabel}>Impact</Text>
                          <Text style={s.riskFieldValue}>{r.impact}</Text>
                        </>
                      ) : null}
                      <Text style={s.riskFieldLabel}>Likelihood</Text>
                      <Text style={[s.riskFieldValue, { marginBottom: r.mitigation ? 5 : 0 }]}>
                        {capitalize(r.likelihood)}
                      </Text>
                      {r.mitigation ? (
                        <>
                          <Text style={s.riskFieldLabel}>Mitigation</Text>
                          <Text style={[s.riskFieldValue, { marginBottom: 0 }]}>{r.mitigation}</Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                ))}
                {/* Pad odd row so it aligns */}
                {pair.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))}
          </Section>
        )}

        {/* Open Questions */}
        {ai.openQuestions.length > 0 && (
          <Section title="Open Questions" count={ai.openQuestions.length}>
            {ai.openQuestions.map((q, i) => (
              <View key={i} style={s.questionRow}>
                <Text style={s.questionNum}>{i + 1}.</Text>
                <Text style={s.questionText}>{q}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* AI Insights */}
        {ai.aiInsights.length > 0 && (
          <Section title="AI Insights" count={ai.aiInsights.length}>
            {ai.aiInsights.map((insight, i) => (
              <View key={i} style={s.insightRow}>
                <Text style={s.insightDot}>•</Text>
                <Text style={s.insightText}>{insight.content}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Timeline */}
        {ai.timeline.length > 0 && (
          <Section title="Meeting Timeline" count={ai.timeline.length}>
            {ai.timeline.map((event, i) => (
              <View key={i} style={s.timelineRow}>
                <View style={s.timelineDotWrap}>
                  <View style={s.timelineDot} />
                </View>
                <View style={s.timelineContent}>
                  <Text style={s.timelineMoment}>{event.moment}</Text>
                  <Text style={s.timelineDesc}>{event.description}</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Progress Summary */}
        {total > 0 && (
          <Section title="Progress Summary">
            <View style={s.progressRow}>
              <View style={s.progressCell}>
                <Text style={[s.progressValue, { color: T.statusGreen }]}>{done}</Text>
                <Text style={s.progressLabel}>Completed</Text>
              </View>
              <View style={s.progressCell}>
                <Text style={[s.progressValue, { color: T.muted }]}>{total - done}</Text>
                <Text style={s.progressLabel}>Pending</Text>
              </View>
              <View style={s.progressCell}>
                <Text style={[s.progressValue, { color: T.ink }]}>{total}</Text>
                <Text style={s.progressLabel}>Total</Text>
              </View>
            </View>
          </Section>
        )}
      </View>

      {/* Footer */}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>Generated by Memora</Text>
        <Text
          style={s.footerText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  )
}

// ─── Legacy document (fallback for older meetings) ────────────────────────────

function LegacyDocument({
  meeting,
  actionItems,
  decisions,
  risks,
  questions,
}: MeetingPDFProps) {
  const displayDate = meeting.processed_at ?? meeting.created_at

  return (
    <Page size="A4" style={s.page}>
      <View style={s.cover}>
        <Text style={s.coverBrand}>MEMORA</Text>
        <Text style={s.coverTitle}>{meeting.title}</Text>
        <View style={s.coverMeta}>
          <Text style={s.coverMetaText}>{formatDate(displayDate)}</Text>
          {meeting.participants && meeting.participants.length > 0 && (
            <>
              <Text style={s.coverMetaSep}>·</Text>
              <Text style={s.coverMetaText}>{meeting.participants.join(', ')}</Text>
            </>
          )}
        </View>
      </View>

      <View style={s.body}>
        {meeting.summary ? (
          <Section title="Summary">
            <Text style={{ fontSize: 9, color: T.ink, lineHeight: 1.65 }}>
              {meeting.summary}
            </Text>
          </Section>
        ) : null}

        {meeting.key_points && meeting.key_points.length > 0 ? (
          <Section title="Key Points" count={meeting.key_points.length}>
            {meeting.key_points.map((point, i) => (
              <View key={i} style={s.keyPointRow}>
                <Text style={s.keyPointDot}>•</Text>
                <Text style={s.keyPointText}>{point}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {actionItems.length > 0 ? (
          <Section title="Action Items" count={actionItems.length}>
            <View style={s.tableOuter}>
              <View style={s.tableHead}>
                <View style={s.colCheck} />
                <View style={s.colTask}>
                  <Text style={s.tableHeadText}>Task</Text>
                </View>
                <View style={s.colOwner}>
                  <Text style={s.tableHeadText}>Owner</Text>
                </View>
                <View style={s.colPriority}>
                  <Text style={s.tableHeadText}>Priority</Text>
                </View>
              </View>
              {actionItems.map((item, i) => (
                <View key={item.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <View style={s.colCheck}>
                    <View style={[s.checkBox, item.completed ? s.checkBoxDone : {}]}>
                      {item.completed ? <Text style={s.checkMark}>✓</Text> : null}
                    </View>
                  </View>
                  <View style={s.colTask}>
                    <Text style={[s.taskText, item.completed ? s.taskTextDone : {}]}>
                      {item.content}
                    </Text>
                  </View>
                  <View style={s.colOwner}>
                    <Text style={s.colText}>{item.assignee ?? '—'}</Text>
                  </View>
                  <View style={s.colPriority}>
                    <PriorityBadge priority={item.priority} />
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {decisions.length > 0 ? (
          <Section title="Decisions" count={decisions.length}>
            {decisions.map((d, i) => (
              <View key={d.id} style={s.decisionRow}>
                <View style={s.decisionNumBox}>
                  <Text style={s.decisionNumText}>{i + 1}</Text>
                </View>
                <View style={s.decisionBody}>
                  <Text style={s.decisionText}>{d.content}</Text>
                  {d.context ? <Text style={s.decisionMeta}>{d.context}</Text> : null}
                </View>
              </View>
            ))}
          </Section>
        ) : null}

        {risks.length > 0 ? (
          <Section title="Risks & Blockers" count={risks.length}>
            {Array.from({ length: Math.ceil(risks.length / 2) }, (_, pi) => (
              <View key={pi} style={s.riskPair}>
                {risks.slice(pi * 2, pi * 2 + 2).map((r, ri) => (
                  <View key={ri} style={s.riskCard}>
                    <View style={s.riskCardHead}>
                      <Text style={s.riskTitle}>{r.content}</Text>
                      <SevBadge severity={r.severity} />
                    </View>
                    <View style={s.riskBody}>
                      <Text style={s.riskFieldLabel}>Severity</Text>
                      <Text style={[s.riskFieldValue, { marginBottom: 0 }]}>
                        {capitalize(r.severity)}
                      </Text>
                    </View>
                  </View>
                ))}
                {risks.slice(pi * 2, pi * 2 + 2).length === 1 && (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            ))}
          </Section>
        ) : null}

        {questions.length > 0 ? (
          <Section title="Open Questions" count={questions.length}>
            {questions.map((q, i) => (
              <View key={q.id} style={s.questionRow}>
                <Text style={s.questionNum}>{i + 1}.</Text>
                <Text style={s.questionText}>{q.question}</Text>
              </View>
            ))}
          </Section>
        ) : null}
      </View>

      <View style={s.footer} fixed>
        <Text style={s.footerText}>Generated by Memora</Text>
        <Text
          style={s.footerText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function MeetingPDFDocument(props: MeetingPDFProps) {
  const ai = getAiAnalysis(props.meeting)

  return (
    <Document
      title={props.meeting.title}
      author="Memora"
      creator="Memora"
      producer="Memora"
    >
      {ai ? (
        <PremiumDocument
          meeting={props.meeting}
          actionItems={props.actionItems}
          ai={ai}
        />
      ) : (
        <LegacyDocument {...props} />
      )}
    </Document>
  )
}
