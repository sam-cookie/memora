// Always renders with fixed dark colors for visual consistency regardless of user theme.

interface MeetingRow {
  title: string
  meta: string
  excerpt: string
  status: string
  statusColor: string
  statusBg: string
}

const MEETINGS: MeetingRow[] = [
  {
    title: 'Q2 Strategy Review',
    meta: 'Jun 28 · 47 min · 6 participants',
    excerpt: 'Roadmap priorities confirmed, Q3 planning kicked off, mobile-first direction adopted.',
    status: 'Summary',
    statusColor: 'rgba(96,165,250,0.9)',
    statusBg: 'rgba(96,165,250,0.1)',
  },
  {
    title: 'Design System Workshop',
    meta: 'Jun 26 · 2h 10m · 8 participants',
    excerpt: 'Component library finalized, accessibility updated to WCAG 2.1 AA compliance.',
    status: 'Complete',
    statusColor: 'rgba(52,211,153,0.9)',
    statusBg: 'rgba(52,211,153,0.1)',
  },
  {
    title: 'Engineering All-Hands',
    meta: 'Jun 25 · 1h 02m · 22 participants',
    excerpt: 'Sprint goals reviewed, OKR progress shared, Q3 hiring plan presented.',
    status: 'Processing',
    statusColor: 'rgba(251,191,36,0.9)',
    statusBg: 'rgba(251,191,36,0.1)',
  },
]

const NAV_ITEMS = ['Meetings', 'Action Items', 'Search', 'Calendar', 'Analytics']

export function DashboardMockup() {
  return (
    <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Ambient glow beneath the mockup */}
      <div
        style={{
          position: 'absolute',
          bottom: '-24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '65%',
          height: '80px',
          borderRadius: '9999px',
          background: 'rgba(37, 99, 235, 0.18)',
          filter: 'blur(48px)',
          pointerEvents: 'none',
        }}
      />

      {/* Browser chrome frame */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0A0A0A',
          boxShadow:
            '0 32px 80px -12px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Chrome bar */}
        <div
          style={{
            display: 'flex',
            height: '36px',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: '#141414',
            padding: '0 16px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            {['#FF5F57', '#FFBD2E', '#28C840'].map((c) => (
              <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '20px',
              width: '180px',
              borderRadius: '4px',
              background: '#1E1E1E',
            }}
          >
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>
              memora.app/meetings
            </span>
          </div>
        </div>

        {/* App shell */}
        <div style={{ display: 'flex', height: '340px' }}>
          {/* Sidebar */}
          <div
            style={{
              width: '168px',
              flexShrink: 0,
              borderRight: '1px solid rgba(255,255,255,0.06)',
              background: '#0F0F0F',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                M
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Memora</span>
            </div>

            {/* Nav */}
            {NAV_ITEMS.map((item, i) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  marginBottom: '2px',
                  background: i === 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    background: i === 0 ? 'rgba(96,165,250,0.75)' : 'rgba(255,255,255,0.15)',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    color: i === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Main area */}
          <div style={{ flex: 1, background: '#0A0A0A', padding: '16px', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>All Meetings</span>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#2563EB',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#fff',
                }}
              >
                + New Meeting
              </div>
            </div>

            {/* Meeting rows */}
            {MEETINGS.map((m) => (
              <div
                key={m.title}
                style={{
                  marginBottom: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.025)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
                    {m.title}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: '10px',
                      fontWeight: 500,
                      color: m.statusColor,
                      background: m.statusBg,
                      padding: '1px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    {m.status}
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginBottom: '4px' }}>
                  {m.meta}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.48)', lineHeight: 1.5 }}>
                  {m.excerpt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
