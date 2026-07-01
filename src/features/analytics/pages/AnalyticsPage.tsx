import { BarChart2 } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TooltipProps } from 'recharts'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useAnalytics } from '../hooks/useAnalytics'

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  primary: '#6366f1',   // indigo
  emerald: '#10b981',
  amber: '#f59e0b',
  sky: '#0ea5e9',
  rose: '#f43f5e',
  violet: '#8b5cf6',
}

const STATUS_COLORS: Record<string, string> = {
  completed: C.emerald,
  pending: C.amber,
  uploading: C.sky,
  transcribing: C.violet,
  analyzing: C.primary,
  failed: C.rose,
}

const PIE_FALLBACK = '#6b7280'

// ─── Shared chart styles ──────────────────────────────────────────────────────

const AXIS_STYLE = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
const GRID_STROKE = 'hsl(var(--border))'

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-medium text-muted-foreground mb-1.5">{label}</p>}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-foreground font-semibold">{entry.value}</span>
          <span className="text-muted-foreground">{entry.name}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Chart card ───────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card className="p-5 space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { data, isLoading } = useAnalytics()

  const noData =
    !isLoading &&
    data &&
    data.meetingsByMonth.length === 0 &&
    data.topParticipants.length === 0

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Analytics"
        description="Insights across your meetings and team activity"
        icon={BarChart2}
      />

      <div className="flex-1 p-6 space-y-6">
        {noData && (
          <EmptyState
            icon={BarChart2}
            title="No data yet"
            description="Upload and process meetings to see analytics here."
          />
        )}

        {(isLoading || !noData) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Meetings per month */}
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ChartCard title="Meetings per month" subtitle="All uploaded meetings over time">
                {data!.meetingsByMonth.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data!.meetingsByMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad-meetings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="meetings"
                        stroke={C.primary}
                        strokeWidth={2}
                        fill="url(#grad-meetings)"
                        dot={false}
                        activeDot={{ r: 4, fill: C.primary }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            )}

            {/* Tasks completed */}
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ChartCard title="Tasks completed" subtitle="Total vs completed action items by month">
                {data!.actionItemsByMonth.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data!.actionItemsByMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="total" name="total" fill={C.sky} radius={[3, 3, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="completed" name="completed" fill={C.emerald} radius={[3, 3, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            )}

            {/* Meeting status breakdown */}
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ChartCard title="Meeting status" subtitle="Distribution across all meetings">
                {data!.statusBreakdown.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No data</div>
                ) : (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={data!.statusBreakdown}
                          dataKey="count"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          strokeWidth={0}
                          paddingAngle={2}
                        >
                          {data!.statusBreakdown.map((entry) => (
                            <Cell
                              key={entry.status}
                              fill={STATUS_COLORS[entry.status] ?? PIE_FALLBACK}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <ul className="space-y-2 flex-1">
                      {data!.statusBreakdown.map((entry) => (
                        <li key={entry.status} className="flex items-center gap-2 text-xs">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: STATUS_COLORS[entry.status] ?? PIE_FALLBACK }}
                          />
                          <span className="text-foreground flex-1">{entry.label}</span>
                          <span className="font-semibold text-foreground">{entry.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </ChartCard>
            )}

            {/* Top participants */}
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ChartCard title="Most active participants" subtitle="Frequency across meetings">
                {data!.topParticipants.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                    No participants detected yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(160, data!.topParticipants.length * 32)}>
                    <BarChart
                      layout="vertical"
                      data={data!.topParticipants}
                      margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                      <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={AXIS_STYLE}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="meetings" name="meetings" fill={C.violet} radius={[0, 3, 3, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
