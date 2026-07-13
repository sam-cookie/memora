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

const T = {
  ink: '#111827',
  secondary: '#374151',
  muted: '#6B7280',
  faint: '#9CA3AF',
  faintest: '#D1D5DB',

  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',

  // Accent — used sparingly
  slate: '#1E293B',
  slateLight: '#475569',

  // Status — text only
  green: '#16A34A',
  amber: '#D97706',
  red: '#DC2626',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: T.ink,
    backgroundColor: T.white,
    paddingBottom: 44,
  },

  // ── Document header ───────────────────────────────────────────────
  header: {
    paddingTop: 42,
    paddingBottom: 22,
    paddingLeft: 52,
    paddingRight: 52,
    borderBottomWidth: 1,
    borderBottomColor: T.gray200,
    marginBottom: 24,
  },
  headerBrand: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: T.faint,
    letterSpacing: 2,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: T.slate,
    lineHeight: 1.2,
    marginBottom: 12,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerMetaText: {
    fontSize: 9,
    color: T.secondary,
  },
  headerMetaSep: {
    fontSize: 9,
    color: T.faint,
    marginLeft: 7,
    marginRight: 7,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Body ──────────────────────────────────────────────────────────
  body: {
    paddingLeft: 52,
    paddingRight: 52,
  },

  // ── Section ───────────────────────────────────────────────────────
  // Level 1 heading: bold, 9.5pt, dark — clearly marks each section
  section: {
    marginBottom: 20,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: T.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionCount: {
    fontSize: 8.5,
    color: T.muted,
  },
  sectionRule: {
    borderTopWidth: 0.75,
    borderTopColor: T.gray300,
    marginBottom: 10,
  },

  // ── Executive Summary ─────────────────────────────────────────────
  execGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  execCell: { flex: 1 },
  execCellLabel: {
    // Property label: 8pt, bold, muted — readable field names
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  execCellValue: {
    fontSize: 9.5,
    color: T.ink,
    lineHeight: 1.55,
  },
  execDivider: {
    borderTopWidth: 0.5,
    borderTopColor: T.gray200,
    marginBottom: 9,
  },
  execPara: {
    fontSize: 9.5,
    color: T.ink,
    lineHeight: 1.7,
  },

  // ── Discussion topics ─────────────────────────────────────────────
  topicBlock: {
    marginBottom: 9,
  },
  topicTitle: {
    // Level 2 heading: 10pt bold ink
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: T.ink,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
    paddingLeft: 10,
  },
  bulletDot: {
    width: 10,
    fontSize: 9.5,
    color: T.muted,
    marginTop: 0.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: T.ink,
    lineHeight: 1.55,
  },

  // ── Action items ──────────────────────────────────────────────────
  tableOuter: {
    borderWidth: 0.75,
    borderColor: T.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.gray100,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 0.75,
    borderBottomColor: T.gray200,
  },
  tableHeadText: {
    // Table column labels: 8pt bold, muted
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: T.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: T.gray200,
  },
  colCheck: { width: 14, flexShrink: 0 },
  colTask: { flex: 1, paddingRight: 8 },
  colOwner: { width: 68, paddingRight: 6, flexShrink: 0 },
  colPriority: { width: 44, flexShrink: 0 },
  colDue: { width: 44, flexShrink: 0 },

  checkBox: {
    width: 9,
    height: 9,
    borderWidth: 0.75,
    borderColor: T.gray300,
    borderRadius: 1.5,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: {
    backgroundColor: T.slate,
    borderColor: T.slate,
  },
  checkMark: {
    fontSize: 5.5,
    color: T.white,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  taskText: {
    fontSize: 9.5,
    color: T.ink,
    lineHeight: 1.45,
  },
  taskTextDone: {
    color: T.muted,
  },
  colText: {
    fontSize: 9,
    color: T.secondary,
    lineHeight: 1.4,
  },
  inferredTag: {
    fontSize: 7.5,
    color: T.muted,
    marginTop: 1,
  },
  priorityLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },

  // ── Decisions ─────────────────────────────────────────────────────
  decisionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: T.gray200,
  },
  decisionNum: {
    width: 20,
    fontSize: 9,
    color: T.muted,
    flexShrink: 0,
    marginTop: 0.5,
  },
  decisionBody: { flex: 1 },
  decisionText: {
    // Level 2: 10pt bold ink
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: T.ink,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  decisionContext: {
    fontSize: 9,
    color: T.secondary,
    lineHeight: 1.55,
    borderLeftWidth: 2,
    borderLeftColor: T.gray300,
    paddingLeft: 7,
    marginBottom: 3,
  },
  decisionImpact: {
    fontSize: 8.5,
    color: T.muted,
    lineHeight: 1.4,
    marginTop: 2,
  },

  // ── Risks ─────────────────────────────────────────────────────────
  riskItem: {
    paddingTop: 9,
    paddingBottom: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: T.gray200,
  },
  riskItemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  riskTitle: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: T.ink,
    lineHeight: 1.4,
    marginRight: 10,
  },
  riskSeverityLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  riskFieldsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 5,
  },
  riskFieldLabel: {
    // Property label: 8pt bold muted
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  riskFieldValue: {
    fontSize: 9,
    color: T.ink,
    lineHeight: 1.45,
  },
  riskMitigation: {
    fontSize: 9,
    color: T.secondary,
    lineHeight: 1.55,
    borderLeftWidth: 2,
    borderLeftColor: T.gray300,
    paddingLeft: 7,
    marginTop: 4,
  },

  // ── Open questions ────────────────────────────────────────────────
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 5,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: T.gray200,
  },
  questionNum: {
    width: 20,
    fontSize: 9,
    color: T.muted,
    flexShrink: 0,
    marginTop: 0.5,
  },
  questionText: {
    flex: 1,
    fontSize: 9.5,
    color: T.ink,
    lineHeight: 1.55,
  },

  // ── AI Insights ───────────────────────────────────────────────────
  insightItem: {
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: T.gray200,
  },
  insightLabel: {
    // Property label: 8pt bold muted
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  insightText: {
    fontSize: 9.5,
    color: T.ink,
    lineHeight: 1.55,
  },

  // ── Timeline ──────────────────────────────────────────────────────
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: T.gray200,
  },
  timelineMoment: {
    width: 80,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: T.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    flexShrink: 0,
    marginTop: 1,
  },
  timelineDesc: {
    flex: 1,
    fontSize: 9.5,
    color: T.ink,
    lineHeight: 1.55,
  },

  // ── Progress ──────────────────────────────────────────────────────
  progressRow: {
    flexDirection: 'row',
    gap: 0,
  },
  progressCell: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    borderRightWidth: 0.5,
    borderRightColor: T.gray200,
  },
  progressValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: T.slate,
    marginBottom: 3,
  },
  progressLabel: {
    // Property label: 8pt bold muted
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // ── Legacy key points ─────────────────────────────────────────────
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  keyPointDot: {
    width: 10,
    fontSize: 9.5,
    color: T.muted,
  },
  keyPointText: {
    flex: 1,
    fontSize: 9.5,
    color: T.ink,
    lineHeight: 1.55,
  },

  // ── Footer ────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 52,
    right: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
    borderTopWidth: 0.5,
    borderTopColor: T.gray200,
  },
  footerText: {
    fontSize: 7.5,
    color: T.faint,
  },
})

// ─── Color maps ───────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<ActionItemPriority, string> = {
  critical: T.red,
  high: '#EA580C',
  medium: T.muted,
  low: T.faint,
}

const SEV_COLOR: Record<RiskSeverity, string> = {
  critical: T.red,
  high: '#EA580C',
  medium: '#D97706',
  low: T.muted,
}

const STATUS_COLOR: Record<MeetingOverallStatus, string> = {
  'on-track': T.green,
  'at-risk': T.amber,
  blocked: T.red,
}

const STATUS_LABEL: Record<MeetingOverallStatus, string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  blocked: 'Blocked',
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
          <Text style={s.sectionCount}>({count})</Text>
        )}
      </View>
      <View style={s.sectionRule} />
      {children}
    </View>
  )
}

// ─── Premium document ─────────────────────────────────────────────────────────

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
  const status = ai.executiveSummary.status

  return (
    <Page size="A4" style={s.page}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerBrand}>Memora</Text>
        <Text style={s.headerTitle}>{meeting.title}</Text>
        <View style={s.headerMeta}>
          <Text style={s.headerMetaText}>{formatDate(displayDate)}</Text>
          {meeting.duration_seconds && (
            <>
              <Text style={s.headerMetaSep}>·</Text>
              <Text style={s.headerMetaText}>{formatDuration(meeting.duration_seconds)}</Text>
            </>
          )}
          {meeting.participants && meeting.participants.length > 0 && (
            <>
              <Text style={s.headerMetaSep}>·</Text>
              <Text style={s.headerMetaText}>{meeting.participants.join(', ')}</Text>
            </>
          )}
          <Text style={s.headerMetaSep}>·</Text>
          <Text style={[s.statusText, { color: STATUS_COLOR[status] }]}>
            {STATUS_LABEL[status]}
          </Text>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={s.body}>

        {/* Executive Summary */}
        <Section title="Executive Summary">
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
          <View style={s.execDivider} />
          <Text style={s.execPara}>{ai.executiveSummary.paragraph}</Text>
        </Section>

        {/* Discussion Topics */}
        {ai.discussionTopics.length > 0 && (
          <Section title="Discussion Topics" count={ai.discussionTopics.length}>
            {ai.discussionTopics.map((topic, i) => (
              <View key={i} style={s.topicBlock}>
                <Text style={s.topicTitle}>{topic.topic}</Text>
                {topic.points.map((point, j) => (
                  <View key={j} style={s.bulletRow}>
                    <Text style={s.bulletDot}>–</Text>
                    <Text style={s.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Section>
        )}

        {/* Action Items */}
        {ai.actionItems.length > 0 && (
          <Section title="Action Items" count={ai.actionItems.length}>
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
                <View style={s.colDue}>
                  <Text style={s.tableHeadText}>Due</Text>
                </View>
              </View>
              {ai.actionItems.map((item, i) => {
                const dbItem = actionItems[i]
                const completed = dbItem?.completed ?? false
                return (
                  <View key={i} style={s.tableRow}>
                    <View style={s.colCheck}>
                      <View style={[s.checkBox, completed ? s.checkBoxDone : {}]}>
                        {completed && <Text style={s.checkMark}>✓</Text>}
                      </View>
                    </View>
                    <View style={s.colTask}>
                      <Text style={[s.taskText, completed ? s.taskTextDone : {}]}>
                        {item.content}
                      </Text>
                      {item.confidence !== 'high' && (
                        <Text style={s.inferredTag}>
                          {item.confidence === 'medium' ? 'inferred' : 'estimated'}
                        </Text>
                      )}
                    </View>
                    <View style={s.colOwner}>
                      <Text style={s.colText}>{item.assignee ?? '—'}</Text>
                    </View>
                    <View style={s.colPriority}>
                      <Text style={[s.priorityLabel, { color: PRIORITY_COLOR[item.priority] }]}>
                        {capitalize(item.priority)}
                      </Text>
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

        {/* Decisions */}
        {ai.decisions.length > 0 && (
          <Section title="Decisions" count={ai.decisions.length}>
            {ai.decisions.map((d, i) => (
              <View key={i} style={s.decisionItem}>
                <Text style={s.decisionNum}>{i + 1}.</Text>
                <View style={s.decisionBody}>
                  <Text style={s.decisionText}>{d.content}</Text>
                  {d.context && (
                    <Text style={s.decisionContext}>{d.context}</Text>
                  )}
                  {d.impact && (
                    <Text style={s.decisionImpact}>{d.impact}</Text>
                  )}
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Risks & Blockers */}
        {ai.risks.length > 0 && (
          <Section title="Risks & Blockers" count={ai.risks.length}>
            {ai.risks.map((r, i) => (
              <View key={i} style={s.riskItem}>
                <View style={s.riskItemHead}>
                  <Text style={s.riskTitle}>{r.content}</Text>
                  <Text style={[s.riskSeverityLabel, { color: SEV_COLOR[r.severity] }]}>
                    {capitalize(r.severity)}
                  </Text>
                </View>
                <View style={s.riskFieldsRow}>
                  {r.impact && (
                    <View style={{ flex: 1 }}>
                      <Text style={s.riskFieldLabel}>Impact</Text>
                      <Text style={s.riskFieldValue}>{r.impact}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.riskFieldLabel}>Likelihood</Text>
                    <Text style={s.riskFieldValue}>{capitalize(r.likelihood)}</Text>
                  </View>
                </View>
                {r.mitigation && (
                  <Text style={s.riskMitigation}>{r.mitigation}</Text>
                )}
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
              <View key={i} style={s.insightItem}>
                <Text style={s.insightLabel}>
                  {INSIGHT_LABEL[insight.type] ?? insight.type}
                </Text>
                <Text style={s.insightText}>{insight.content}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Timeline */}
        {ai.timeline.length > 0 && (
          <Section title="Meeting Timeline" count={ai.timeline.length}>
            {ai.timeline.map((event, i) => (
              <View key={i} style={s.timelineItem}>
                <Text style={s.timelineMoment}>{event.moment}</Text>
                <Text style={s.timelineDesc}>{event.description}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Progress Summary */}
        {total > 0 && (
          <Section title="Progress Summary">
            <View style={[s.tableOuter, { overflow: 'hidden' }]}>
              <View style={s.progressRow}>
                <View style={[s.progressCell, { borderRightWidth: 0.5, borderRightColor: T.gray200 }]}>
                  <Text style={s.progressValue}>{done}</Text>
                  <Text style={s.progressLabel}>Completed</Text>
                </View>
                <View style={[s.progressCell, { borderRightWidth: 0.5, borderRightColor: T.gray200 }]}>
                  <Text style={s.progressValue}>{total - done}</Text>
                  <Text style={s.progressLabel}>Pending</Text>
                </View>
                <View style={[s.progressCell, { borderRightWidth: 0 }]}>
                  <Text style={s.progressValue}>{total}</Text>
                  <Text style={s.progressLabel}>Total</Text>
                </View>
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
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </View>
    </Page>
  )
}

// ─── Legacy document ──────────────────────────────────────────────────────────

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
      <View style={s.header}>
        <Text style={s.headerBrand}>Memora</Text>
        <Text style={s.headerTitle}>{meeting.title}</Text>
        <View style={s.headerMeta}>
          <Text style={s.headerMetaText}>{formatDate(displayDate)}</Text>
          {meeting.participants && meeting.participants.length > 0 && (
            <>
              <Text style={s.headerMetaSep}>·</Text>
              <Text style={s.headerMetaText}>{meeting.participants.join(', ')}</Text>
            </>
          )}
        </View>
      </View>

      <View style={s.body}>
        {meeting.summary && (
          <Section title="Summary">
            <Text style={{ fontSize: 9, color: T.secondary, lineHeight: 1.7 }}>
              {meeting.summary}
            </Text>
          </Section>
        )}

        {meeting.key_points && meeting.key_points.length > 0 && (
          <Section title="Key Points" count={meeting.key_points.length}>
            {meeting.key_points.map((point, i) => (
              <View key={i} style={s.keyPointRow}>
                <Text style={s.keyPointDot}>–</Text>
                <Text style={s.keyPointText}>{point}</Text>
              </View>
            ))}
          </Section>
        )}

        {actionItems.length > 0 && (
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
              {actionItems.map((item) => (
                <View key={item.id} style={s.tableRow}>
                  <View style={s.colCheck}>
                    <View style={[s.checkBox, item.completed ? s.checkBoxDone : {}]}>
                      {item.completed && <Text style={s.checkMark}>✓</Text>}
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
                    <Text style={[s.priorityLabel, { color: PRIORITY_COLOR[item.priority] }]}>
                      {capitalize(item.priority)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Section>
        )}

        {decisions.length > 0 && (
          <Section title="Decisions" count={decisions.length}>
            {decisions.map((d, i) => (
              <View key={d.id} style={s.decisionItem}>
                <Text style={s.decisionNum}>{i + 1}.</Text>
                <View style={s.decisionBody}>
                  <Text style={s.decisionText}>{d.content}</Text>
                  {d.context && (
                    <Text style={s.decisionContext}>{d.context}</Text>
                  )}
                </View>
              </View>
            ))}
          </Section>
        )}

        {risks.length > 0 && (
          <Section title="Risks & Blockers" count={risks.length}>
            {risks.map((r) => (
              <View key={r.id} style={s.riskItem}>
                <View style={s.riskItemHead}>
                  <Text style={s.riskTitle}>{r.content}</Text>
                  <Text style={[s.riskSeverityLabel, { color: SEV_COLOR[r.severity] }]}>
                    {capitalize(r.severity)}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {questions.length > 0 && (
          <Section title="Open Questions" count={questions.length}>
            {questions.map((q, i) => (
              <View key={q.id} style={s.questionRow}>
                <Text style={s.questionNum}>{i + 1}.</Text>
                <Text style={s.questionText}>{q.question}</Text>
              </View>
            ))}
          </Section>
        )}
      </View>

      <View style={s.footer} fixed>
        <Text style={s.footerText}>Generated by Memora</Text>
        <Text
          style={s.footerText}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
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
