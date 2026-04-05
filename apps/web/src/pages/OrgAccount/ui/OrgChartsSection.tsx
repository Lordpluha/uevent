import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@shared/components'
import { CalendarDays, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { OrgWalletPayload } from './OrgWalletSection'

type Event = { id: string; date: string }

function getLast6Months() {
  const months: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
    })
  }
  return months
}

function getLast7Days() {
  const days: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    days.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: d.toLocaleString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  return days
}

const revenueConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: '#6366f1' },
}

const eventsConfig: ChartConfig = {
  events: { label: 'Events', color: '#10b981' },
}

export function OrgChartsSection({ wallet, orgEvents }: { wallet: OrgWalletPayload | undefined; orgEvents: Event[] }) {
  const months = useMemo(() => getLast6Months(), [])
  const days = useMemo(() => getLast7Days(), [])

  const revenueData = useMemo(() => {
    const map = Object.fromEntries(months.map((m) => [m.key, { month: m.label, revenue: 0 }]))
    for (const tx of wallet?.transactions ?? []) {
      if (tx.type !== 'sale') continue
      const key = tx.createdAt.slice(0, 7)
      if (map[key]) map[key].revenue += Number(tx.amount)
    }
    return months.map((m) => map[m.key])
  }, [wallet?.transactions, months])

  const eventsData = useMemo(() => {
    const map = Object.fromEntries(days.map((d) => [d.key, { day: d.label, events: 0 }]))
    for (const ev of orgEvents) {
      const parsed = new Date(ev.date)
      if (Number.isNaN(parsed.getTime())) continue
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
      if (map[key]) map[key].events += 1
    }
    return days.map((d) => map[d.key])
  }, [orgEvents, days])

  const currency = wallet?.balance.currency ?? 'USD'
  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0)
  const totalEvents = eventsData.reduce((s, d) => s + d.events, 0)

  return (
    <section className="mt-5 grid gap-4 sm:grid-cols-2">
      {/* Revenue chart */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: '#6366f1' }} />
          <h2 className="text-sm font-semibold">Revenue</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Last 6 months ·{' '}
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalRevenue)}
          </span>{' '}
          total
        </p>
        <ChartContainer config={revenueConfig} className="h-40 w-full">
          <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value)),
                    'Revenue',
                  ]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Events chart */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="mb-1 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" style={{ color: '#10b981' }} />
          <h2 className="text-sm font-semibold">Events</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Last 7 days · <span className="font-medium text-foreground">{totalEvents}</span> published
        </p>
        <ChartContainer config={eventsConfig} className="h-40 w-full">
          <BarChart data={eventsData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="events" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  )
}
