import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Meeting, ActionItem, KeyDecision, Risk, FollowUpQuestion, ActionItemPriority, RiskSeverity } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MeetingPDFProps {
  meeting: Meeting
  actionItems: ActionItem[]
  decisions: KeyDecision[]
  risks: Risk[]
  questions: FollowUpQuestion[]
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#2563EB',
  foreground: '#0F172A',
  muted: '#475569',
  mutedLight: '#94A3B8',
  border: '#E5E7EB',
  card: '#F8FAFC',
  white: '#FFFFFF',
  green: '#22C55E',
  amber: '#D97706',
  red: '#DC2626',
}

const PRIORITY_COLOR: Record<ActionItemPriority, { bg: string; text: string }> = {
  low: { bg: '#F1F5F9', text: '#64748B' },
  medium: { bg: '#FEF3C7', text: '#B45309' },
  high: { bg: '#FEE2E2', text: '#DC2626' },
  critical: { bg: '#FEE2E2', text: '#DC2626' },
}

const SEVERITY_COLOR: Record<RiskSeverity, { bg: string; text: string }> = {
  low: { bg: '#F1F5F9', text: '#64748B' },
  medium: { bg: '#FEF3C7', text: '#B45309' },
  high: { bg: '#FEE2E2', text: '#DC2626' },
  critical: { bg: '#FEE2E2', text: '#DC2626' },
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.foreground,
    backgroundColor: COLORS.white,
    paddingTop: 48,
    paddingBottom: 56,
    paddingLeft: 56,
    paddingRight: 56,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 28,
  },
  brand: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  headerDate: {
    fontSize: 9,
    color: COLORS.muted,
  },

  // ── Title block ─────────────────────────────────────────────────
  titleBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.foreground,
    marginBottom: 10,
    lineHeight: 1.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  metaItem: {
    fontSize: 9,
    color: COLORS.muted,
    marginRight: 16,
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
  },

  // ── Section ─────────────────────────────────────────────────────
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 7,
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.border,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionDivider: {
    flex: 1,
  },

  // ── Body text ────────────────────────────────────────────────────
  bodyText: {
    fontSize: 10,
    color: COLORS.foreground,
    lineHeight: 1.65,
  },

  // ── Bullet list ──────────────────────────────────────────────────
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  bulletDot: {
    width: 14,
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.foreground,
    lineHeight: 1.5,
  },

  // ── Action items ─────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
    padding: 8,
    backgroundColor: COLORS.card,
    borderRadius: 6,
  },
  actionCheck: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: COLORS.mutedLight,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCheckDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionCheckMark: {
    fontSize: 7,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 10,
    color: COLORS.foreground,
    lineHeight: 1.45,
    marginBottom: 4,
  },
  actionTextDone: {
    color: COLORS.mutedLight,
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 3,
    marginRight: 6,
  },
  assignee: {
    fontSize: 8.5,
    color: COLORS.muted,
  },

  // ── Decisions ───────────────────────────────────────────────────
  decisionRow: {
    marginBottom: 10,
  },
  decisionContent: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.foreground,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  decisionContext: {
    fontSize: 9,
    color: COLORS.muted,
    lineHeight: 1.5,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },

  // ── Risks ────────────────────────────────────────────────────────
  riskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },
  riskText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.foreground,
    lineHeight: 1.45,
  },

  // ── Questions ────────────────────────────────────────────────────
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  questionNum: {
    width: 20,
    height: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  questionNumText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  questionText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.foreground,
    lineHeight: 1.45,
  },

  // ── Transcript ───────────────────────────────────────────────────
  transcriptBox: {
    backgroundColor: COLORS.card,
    borderRadius: 6,
    padding: 12,
    borderWidth: 0.75,
    borderColor: COLORS.border,
  },
  transcriptText: {
    fontSize: 8.5,
    fontFamily: 'Courier',
    color: COLORS.muted,
    lineHeight: 1.6,
  },

  // ── Footer ───────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 0.75,
    borderTopColor: COLORS.border,
  },
  footerBrand: {
    fontSize: 8,
    color: COLORS.mutedLight,
  },
  footerPage: {
    fontSize: 8,
    color: COLORS.mutedLight,
  },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}

// ─── PDF Document ────────────────────────────────────────────────────────────

export function MeetingPDFDocument({
  meeting,
  actionItems,
  decisions,
  risks,
  questions,
}: MeetingPDFProps) {
  const displayDate = meeting.processed_at ?? meeting.created_at

  return (
    <Document
      title={meeting.title}
      author="Memora"
      creator="Memora"
      producer="Memora"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header} fixed>
          <Text style={s.brand}>MEMORA</Text>
          <Text style={s.headerDate}>{formatDate(displayDate)}</Text>
        </View>

        {/* Title block */}
        <View style={s.titleBlock}>
          <Text style={s.title}>{meeting.title}</Text>
          <View style={s.metaRow}>
            {meeting.participants && meeting.participants.length > 0 && (
              <Text style={s.metaItem}>
                <Text style={s.metaLabel}>Participants: </Text>
                {meeting.participants.join(', ')}
              </Text>
            )}
          </View>
        </View>

        {/* Summary */}
        {meeting.summary ? (
          <View style={s.section}>
            <SectionHeader title="Summary" />
            <Text style={s.bodyText}>{meeting.summary}</Text>
          </View>
        ) : null}

        {/* Key Points */}
        {meeting.key_points && meeting.key_points.length > 0 ? (
          <View style={s.section}>
            <SectionHeader title="Key Points" />
            {meeting.key_points.map((point, i) => (
              <View key={i} style={s.bulletRow}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Action Items */}
        {actionItems.length > 0 ? (
          <View style={s.section}>
            <SectionHeader title="Action Items" />
            {actionItems.map((item) => {
              const colors = PRIORITY_COLOR[item.priority]
              return (
                <View key={item.id} style={s.actionRow}>
                  <View style={[s.actionCheck, item.completed ? s.actionCheckDone : {}]}>
                    {item.completed ? <Text style={s.actionCheckMark}>✓</Text> : null}
                  </View>
                  <View style={s.actionContent}>
                    <Text style={[s.actionText, item.completed ? s.actionTextDone : {}]}>
                      {item.content}
                    </Text>
                    <View style={s.actionMeta}>
                      <Text style={[s.badge, { backgroundColor: colors.bg, color: colors.text }]}>
                        {capitalize(item.priority)}
                      </Text>
                      {item.assignee ? (
                        <Text style={s.assignee}>→ {item.assignee}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        ) : null}

        {/* Decisions */}
        {decisions.length > 0 ? (
          <View style={s.section}>
            <SectionHeader title="Decisions" />
            {decisions.map((d) => (
              <View key={d.id} style={s.decisionRow}>
                <Text style={s.decisionContent}>{d.content}</Text>
                {d.context ? (
                  <Text style={s.decisionContext}>{d.context}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Risks */}
        {risks.length > 0 ? (
          <View style={s.section}>
            <SectionHeader title="Risks &amp; Blockers" />
            {risks.map((r) => {
              const colors = SEVERITY_COLOR[r.severity]
              return (
                <View key={r.id} style={s.riskRow}>
                  <Text style={[s.badge, { backgroundColor: colors.bg, color: colors.text, marginRight: 8, marginTop: 1 }]}>
                    {capitalize(r.severity)}
                  </Text>
                  <Text style={s.riskText}>{r.content}</Text>
                </View>
              )
            })}
          </View>
        ) : null}

        {/* Follow-up Questions */}
        {questions.length > 0 ? (
          <View style={s.section}>
            <SectionHeader title="Follow-up Questions" />
            {questions.map((q, i) => (
              <View key={q.id} style={s.questionRow}>
                <View style={s.questionNum}>
                  <Text style={s.questionNumText}>{i + 1}</Text>
                </View>
                <Text style={s.questionText}>{q.question}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Transcript */}
        {meeting.transcript ? (
          <View style={s.section}>
            <SectionHeader title="Transcript" />
            <View style={s.transcriptBox}>
              <Text style={s.transcriptText}>{meeting.transcript}</Text>
            </View>
          </View>
        ) : null}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>Generated by Memora</Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
