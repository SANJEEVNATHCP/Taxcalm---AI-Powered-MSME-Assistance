import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: 'var(--tc-notif-bg)', border: '1px solid var(--tc-notif-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p className="font-semibold mb-1.5" style={{ color: 'var(--tc-text-1)' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.name}:{' '}
          <span className="font-semibold" style={{ color: 'var(--tc-text-2)' }}>
            ₹{Number(entry.value).toLocaleString('en-IN')}
          </span>
        </p>
      ))}
    </div>
  )
}

// ── Custom Legend ─────────────────────────────────────────────────────────────
const renderLegend = (props) => {
  const { payload } = props
  return (
    <div className="flex items-center gap-4 justify-end mt-2">
      {payload.map((entry, i) => (
        <span key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--tc-text-3)' }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.value}
        </span>
      ))}
    </div>
  )
}

// ── GST Trend Line Chart ──────────────────────────────────────────────────────
export function GSTLineChart({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
      className="rounded-2xl p-5"
      style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>GST Trend</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Monthly liability vs target</p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: 'var(--tc-text-3)', background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)' }}>
          Last 6 months
        </span>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--tc-divider)" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--tc-text-3)', fontSize: 11, fontFamily: 'Inter' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--tc-text-3)', fontSize: 11, fontFamily: 'Inter' }}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--tc-divider)' }} />
          <Legend content={renderLegend} />
          <Line
            type="monotone"
            dataKey="gst"
            name="GST Paid"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'rgba(139,92,246,0.3)', strokeWidth: 4 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="var(--tc-text-3)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

// ── Expenses Bar Chart ────────────────────────────────────────────────────────
export function ExpensesBarChart({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.18, ease: 'easeOut' }}
      className="rounded-2xl p-5"
      style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Expense Breakdown</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>By category · March 2026</p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: 'var(--tc-text-3)', background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)' }}>
          ₹2,18,500 total
        </span>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--tc-divider)" vertical={false} />
          <XAxis
            dataKey="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--tc-text-3)', fontSize: 10, fontFamily: 'Inter' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--tc-text-3)', fontSize: 11, fontFamily: 'Inter' }}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--tc-btn-micro)' }} />
          <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]} fill="url(#barGradient)" />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.7} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
