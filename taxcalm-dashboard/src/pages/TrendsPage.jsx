import { motion } from 'framer-motion'
import { gstTrendData, expensesData } from '../data/mockData.js'
import { GSTLineChart, ExpensesBarChart } from '../components/ChartCard.jsx'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const revenueData = [
  { month: 'Oct', revenue: 620000, expenses: 180000 },
  { month: 'Nov', revenue: 710000, expenses: 195000 },
  { month: 'Dec', revenue: 680000, expenses: 210000 },
  { month: 'Jan', revenue: 780000, expenses: 200000 },
  { month: 'Feb', revenue: 751200, expenses: 208000 },
  { month: 'Mar', revenue: 842000, expenses: 218500 },
]

const radarData = [
  { metric: 'Revenue', value: 84 },
  { metric: 'GST Filing', value: 78 },
  { metric: 'Expenses', value: 65 },
  { metric: 'Compliance', value: 90 },
  { metric: 'Growth', value: 72 },
  { metric: 'Cash Flow', value: 80 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: 'var(--tc-notif-bg)', border: '1px solid var(--tc-notif-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p className="font-semibold mb-1.5" style={{ color: 'var(--tc-text-1)' }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-xs" style={{ color: e.color }}>
          {e.name}: <span className="font-semibold" style={{ color: 'var(--tc-text-1)' }}>₹{Number(e.value).toLocaleString('en-IN')}</span>
        </p>
      ))}
    </div>
  )
}

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Business Trends</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Key financial and compliance trends for your business</p>
      </motion.div>

      {/* Revenue vs Expenses Area Chart */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="rounded-2xl p-5"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Revenue vs Expenses</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Last 6 months trend</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F87171" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tc-divider)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--tc-text-3)', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--tc-text-3)', fontSize: 11 }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revGrad)" />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#F87171" strokeWidth={2} fill="url(#expGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* GST + Expenses side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GSTLineChart data={gstTrendData} />

        {/* Radar chart */}
        <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible"
          className="rounded-2xl p-5"
          style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
          <div className="mb-5">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Business Health Score</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Multi-dimensional performance view</p>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--tc-divider)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--tc-text-3)', fontSize: 11 }} />
              <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <ExpensesBarChart data={expensesData} />
    </div>
  )
}
