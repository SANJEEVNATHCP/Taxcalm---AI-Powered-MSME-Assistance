import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { gstTrendData, expensesData } from '../data/mockData.js'
import { GSTLineChart, ExpensesBarChart } from '../components/ChartCard.jsx'
import MultiFormatDataInput from '../components/MultiFormatDataInput.jsx'
import BulkDataImporter from '../components/BulkDataImporter.jsx'
import FutureInsights from '../components/FutureInsights.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Legend, Cell, LabelList,
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

// ─── Competitive Analysis Data ──────────────────────────────────────────────
const competitors = [
  { name: 'Your Business', revenue: 842, margin: 74, growth: 35.8, compliance: 90, gstScore: 88, isYou: true },
  { name: 'Sector Avg',    revenue: 620, margin: 61, growth: 18.4, compliance: 72, gstScore: 70, isYou: false },
  { name: 'Top Performer', revenue: 1240, margin: 79, growth: 52.1, compliance: 95, gstScore: 94, isYou: false },
  { name: 'Peer #1',       revenue: 710, margin: 65, growth: 22.0, compliance: 78, gstScore: 74, isYou: false },
  { name: 'Peer #2',       revenue: 580, margin: 58, growth: 14.5, compliance: 68, gstScore: 66, isYou: false },
]

const benchmarkMetrics = [
  { key: 'revenue',    label: 'Revenue (₹K)', color: '#8b5cf6', youColor: '#a78bfa' },
  { key: 'margin',     label: 'Profit Margin %', color: '#38bdf8', youColor: '#7dd3fc' },
  { key: 'growth',     label: 'Growth %', color: '#10b981', youColor: '#34d399' },
  { key: 'compliance', label: 'Compliance Score', color: '#f59e0b', youColor: '#fbbf24' },
]

const marketShareData = [
  { name: 'Your Business', value: 18.4, color: '#8b5cf6' },
  { name: 'Top Performer', value: 27.1, color: '#38bdf8' },
  { name: 'Peer #1',       value: 15.5, color: '#818cf8' },
  { name: 'Peer #2',       value: 12.7, color: '#a78bfa' },
  { name: 'Others',        value: 26.3, color: '#334155' },
]

const sectorTrends = [
  { month: 'Oct', you: 620, sector: 490, top: 980 },
  { month: 'Nov', you: 710, sector: 510, top: 1050 },
  { month: 'Dec', you: 680, sector: 495, top: 1020 },
  { month: 'Jan', you: 780, sector: 540, top: 1100 },
  { month: 'Feb', you: 751, sector: 530, top: 1180 },
  { month: 'Mar', you: 842, sector: 620, top: 1240 },
]

// ─── Competitive Analysis Component ──────────────────────────────────────────
const CompTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs" style={{ background: 'var(--tc-notif-bg)', border: '1px solid var(--tc-notif-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--tc-text-1)' }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }}>{e.name}: <span className="font-semibold" style={{ color: 'var(--tc-text-1)' }}>{typeof e.value === 'number' && e.value > 100 ? `₹${e.value}K` : `${e.value}`}</span></p>
      ))}
    </div>
  )
}

function CompetitiveAnalysis() {
  const [activeMetric, setActiveMetric] = useState('revenue')
  const [activeTab, setActiveTab]       = useState('benchmark')  // benchmark | table | sector

  const metaColor = benchmarkMetrics.find(m => m.key === activeMetric)?.youColor ?? '#8b5cf6'
  const barData   = competitors.map(c => ({ name: c.name, value: c[activeMetric], isYou: c.isYou }))

  const rankByRevenue = [...competitors].sort((a, b) => b.revenue - a.revenue)
  const yourRank = rankByRevenue.findIndex(c => c.isYou) + 1

  const tabs = [
    { id: 'benchmark', label: 'Benchmark' },
    { id: 'table',     label: 'Scorecard' },
    { id: 'sector',    label: 'Sector Trend' },
  ]

  return (
    <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
      className="rounded-2xl p-5"
      style={{ background: 'var(--tc-card-bg)', border: '1px solid rgba(56,189,248,0.25)', boxShadow: '0 0 0 1px rgba(56,189,248,0.06), 0 8px 40px rgba(56,189,248,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, boxShadow: '0 0 16px rgba(56,189,248,0.35)',
          }}>⚔️</div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Competitive Analysis</h3>
            <p className="text-xs" style={{ color: 'var(--tc-text-3)' }}>Your position vs sector peers — MSME Retail Segment</p>
          </div>
        </div>
        {/* Rank badge */}
        <div style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: yourRank === 1 ? 'rgba(16,185,129,0.15)' : yourRank <= 2 ? 'rgba(139,92,246,0.15)' : 'rgba(56,189,248,0.12)',
          color:      yourRank === 1 ? '#34d399'               : yourRank <= 2 ? '#a78bfa'               : '#7dd3fc',
          border: '1px solid currentColor', opacity: 0.9,
          letterSpacing: '0.04em',
        }}>
          #{yourRank} of {competitors.length} in Sector
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tc-card-border)', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '5px 14px', borderRadius: 9, fontSize: 11, fontWeight: 500,
            background: activeTab === t.id ? 'rgba(56,189,248,0.18)' : 'transparent',
            color:      activeTab === t.id ? '#7dd3fc' : 'var(--tc-text-3)',
            border:     activeTab === t.id ? '1px solid rgba(56,189,248,0.28)' : '1px solid transparent',
            cursor: 'pointer', transition: 'all 0.18s',
          }}>{t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Benchmark bar chart ── */}
        {activeTab === 'benchmark' && (
          <motion.div key="benchmark" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            {/* Metric pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {benchmarkMetrics.map(m => (
                <button key={m.key} onClick={() => setActiveMetric(m.key)} style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                  background: activeMetric === m.key ? `${m.youColor}22` : 'transparent',
                  color:      activeMetric === m.key ? m.youColor          : 'var(--tc-text-3)',
                  border:     activeMetric === m.key ? `1px solid ${m.youColor}55` : '1px solid var(--tc-card-border)',
                  cursor: 'pointer', transition: 'all 0.18s', letterSpacing: '0.03em',
                }}>{m.label}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tc-divider)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--tc-text-3)', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--tc-text-3)', fontSize: 10 }} width={38}
                  tickFormatter={v => activeMetric === 'revenue' ? `₹${v}K` : `${v}`} />
                <Tooltip content={<CompTooltip />} />
                <Bar dataKey="value" name={benchmarkMetrics.find(m => m.key === activeMetric)?.label} radius={[6,6,0,0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.isYou ? metaColor : 'rgba(129,140,248,0.28)'}
                      stroke={entry.isYou ? metaColor : 'transparent'} strokeWidth={1} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: 9, fill: 'var(--tc-text-3)' }}
                    formatter={v => activeMetric === 'revenue' ? `₹${v}K` : v} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--tc-text-3)', opacity: 0.5 }}>Highlighted bar = Your Business</p>
          </motion.div>
        )}

        {/* ── Scorecard table ── */}
        {activeTab === 'table' && (
          <motion.div key="table" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['Company', 'Revenue', 'Margin', 'Growth', 'Compliance', 'GST Score', 'Rank'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--tc-text-3)', fontWeight: 600, borderBottom: '1px solid var(--tc-divider)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...competitors].sort((a, b) => b.revenue - a.revenue).map((c, i) => (
                    <tr key={c.name} style={{
                      background: c.isYou ? 'rgba(139,92,246,0.07)' : 'transparent',
                      borderRadius: 8,
                    }}>
                      <td style={{ padding: '9px 10px', color: c.isYou ? '#a78bfa' : 'var(--tc-text-1)', fontWeight: c.isYou ? 700 : 400 }}>
                        {c.isYou ? '★ ' : ''}{c.name}
                      </td>
                      <td style={{ padding: '9px 10px', color: 'var(--tc-text-2)' }}>₹{c.revenue}K</td>
                      <td style={{ padding: '9px 10px' }}>
                        <span style={{
                          color: c.margin >= 70 ? '#34d399' : c.margin >= 60 ? '#fbbf24' : '#f87171',
                          fontWeight: 600,
                        }}>{c.margin}%</span>
                      </td>
                      <td style={{ padding: '9px 10px', color: c.growth > 30 ? '#34d399' : 'var(--tc-text-2)' }}>{c.growth}%</td>
                      <td style={{ padding: '9px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--tc-divider)', minWidth: 60 }}>
                            <div style={{ width: `${c.compliance}%`, height: '100%', borderRadius: 3, background: c.compliance >= 85 ? '#10b981' : c.compliance >= 70 ? '#f59e0b' : '#f87171' }} />
                          </div>
                          <span style={{ color: 'var(--tc-text-3)', fontSize: 10 }}>{c.compliance}</span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 10px', color: 'var(--tc-text-2)' }}>{c.gstScore}</td>
                      <td style={{ padding: '9px 10px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: i === 0 ? 'rgba(16,185,129,0.15)' : i === 1 ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.05)',
                          color: i === 0 ? '#34d399' : i === 1 ? '#a78bfa' : 'var(--tc-text-3)',
                        }}>#{i + 1}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: 'Above Sector Avg', value: 'Revenue +35.8%', color: '#34d399', glow: 'rgba(16,185,129,0.12)' },
                { label: 'Compliance Rank',  value: '#1 in Peer Group', color: '#a78bfa', glow: 'rgba(139,92,246,0.12)' },
                { label: 'Gap to Leader',    value: `₹${1240 - 842}K Revenue`, color: '#fbbf24', glow: 'rgba(245,158,11,0.12)' },
              ].map(s => (
                <div key={s.label} style={{
                  borderRadius: 10, padding: '8px 10px',
                  background: s.glow, border: `1px solid ${s.color}22`,
                }}>
                  <p style={{ fontSize: 9, color: 'var(--tc-text-3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Sector trend lines ── */}
        {activeTab === 'sector' && (
          <motion.div key="sector" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={sectorTrends} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="youGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.20} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tc-divider)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--tc-text-3)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--tc-text-3)', fontSize: 11 }}
                  tickFormatter={v => `₹${v}K`} width={48} />
                <Tooltip content={<CompTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={v => <span style={{ color: 'var(--tc-text-3)' }}>{v}</span>} />
                <Area type="monotone" dataKey="top"  name="Top Performer" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#topGrad)" />
                <Area type="monotone" dataKey="you"  name="Your Business" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#youGrad2)" />
                <Area type="monotone" dataKey="sector" name="Sector Avg" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#secGrad)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.14)', color: 'var(--tc-text-2)' }}>
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>AI Read — </span>
              Your revenue trajectory consistently outpaces the sector average by <span style={{ color: '#34d399', fontWeight: 600 }}>+35.8%</span>. The gap to the top performer is <span style={{ color: '#fbbf24', fontWeight: 600 }}>₹398K</span> — achievable with Q3 expansion. Sector is growing at 18% CAGR; your current pace puts you on track to claim the #1 position within 2 quarters.
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}

// ─── AI Insight Engine ────────────────────────────────────────────────────────
function deriveInsights(revenue, radar) {
  const first = revenue[0]
  const last  = revenue[revenue.length - 1]
  const revGrowth = (((last.revenue - first.revenue) / first.revenue) * 100).toFixed(1)
  const margin    = (((last.revenue - last.expenses) / last.revenue) * 100).toFixed(1)
  const prevMargin= (((revenue[revenue.length - 2].revenue - revenue[revenue.length - 2].expenses) / revenue[revenue.length - 2].revenue) * 100).toFixed(1)
  const marginDelta = (margin - prevMargin).toFixed(1)

  const best  = [...radar].sort((a, b) => b.value - a.value)[0]
  const worst = [...radar].sort((a, b) => a.value - b.value)[0]

  const expTrend = last.expenses > revenue[revenue.length - 2].expenses ? 'rising' : 'declining'
  const expPct   = (((last.expenses - revenue[revenue.length - 2].expenses) /
                      revenue[revenue.length - 2].expenses) * 100).toFixed(1)

  const gstArr = Array.isArray(gstTrendData) ? gstTrendData : []
  const avgGst = gstArr.length
    ? (gstArr.reduce((s, d) => s + (d.gst ?? d.value ?? 0), 0) / gstArr.length).toFixed(0)
    : null

  return [
    {
      id: 'revenue',
      icon: '📈',
      color: '#8b5cf6',
      glow: 'rgba(139,92,246,0.18)',
      badge: `+${revGrowth}%`,
      badgeColor: '#a78bfa',
      title: 'Revenue Growth',
      summary: `Revenue grew ${revGrowth}% over the last 6 months — from ₹${(first.revenue / 1000).toFixed(0)}K to ₹${(last.revenue / 1000).toFixed(0)}K.`,
      action: revGrowth > 20
        ? 'Strong momentum. Consider reinvesting surplus into inventory or marketing to sustain this trajectory.'
        : 'Growth is moderate. Audit underperforming product lines and review pricing strategy.',
    },
    {
      id: 'margin',
      icon: marginDelta >= 0 ? '✅' : '⚠️',
      color: marginDelta >= 0 ? '#10b981' : '#f59e0b',
      glow: marginDelta >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
      badge: `${marginDelta >= 0 ? '+' : ''}${marginDelta}% MoM`,
      badgeColor: marginDelta >= 0 ? '#34d399' : '#fbbf24',
      title: 'Net Profit Margin',
      summary: `Current margin is ${margin}% in ${last.month}${marginDelta >= 0 ? ', improving from last month' : ', slipping slightly MoM'}.`,
      action: marginDelta < 0
        ? `Expenses are ${expTrend} by ${Math.abs(expPct)}%. Review operating costs and defer non-critical spends.`
        : `Margin is healthy. Locking in supplier rates now could protect margins in Q3.`,
    },
    {
      id: 'health',
      icon: '🏆',
      color: '#38bdf8',
      glow: 'rgba(56,189,248,0.15)',
      badge: `${best.value}/100`,
      badgeColor: '#7dd3fc',
      title: `Strength: ${best.metric}`,
      summary: `Your highest-performing dimension is ${best.metric} (${best.value}/100), well above the industry median of ~65.`,
      action: `Leverage strong ${best.metric} as a differentiator when pitching to lenders or investors.`,
    },
    {
      id: 'risk',
      icon: '🎯',
      color: '#f87171',
      glow: 'rgba(248,113,113,0.15)',
      badge: `${worst.value}/100`,
      badgeColor: '#fca5a5',
      title: `Focus Area: ${worst.metric}`,
      summary: `${worst.metric} scores ${worst.value}/100 — your lowest metric this period.`,
      action: worst.metric === 'Expenses'
        ? 'Implement category-level expense caps and weekly budget reviews to bring this score up.'
        : `Run a targeted improvement sprint on ${worst.metric} to balance your overall business health.`,
    },
    ...(avgGst
      ? [{
          id: 'gst',
          icon: '🧾',
          color: '#818cf8',
          glow: 'rgba(129,140,248,0.15)',
          badge: `Avg ₹${Number(avgGst).toLocaleString('en-IN')}`,
          badgeColor: '#a5b4fc',
          title: 'GST Collection Trend',
          summary: `Average GST collected per period is ₹${Number(avgGst).toLocaleString('en-IN')}. Regular filing is keeping you compliant.`,
          action: 'Reconcile input tax credits each month — even small mismatches compound into penalty notices.',
        }]
      : []),
  ]
}

// ─── Typing text component ────────────────────────────────────────────────────
function TypingText({ text, speed = 22 }) {
  const [displayed, setDisplayed] = useState('')
  const idx = useRef(0)
  useEffect(() => {
    idx.current = 0
    setDisplayed('')
    const id = setInterval(() => {
      idx.current++
      setDisplayed(text.slice(0, idx.current))
      if (idx.current >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return <span>{displayed}<span className="tc-cursor" /></span>
}

// ─── AI Insights panel ────────────────────────────────────────────────────────
function AIInsightsPanel({ revenue, radar }) {
  const [phase, setPhase]     = useState('idle')   // idle | analyzing | done
  const [insights, setInsights] = useState([])
  const [activeIdx, setActiveIdx] = useState(null)
  const [key, setKey] = useState(0)

  const run = () => {
    setPhase('analyzing')
    setInsights([])
    setActiveIdx(null)
    setTimeout(() => {
      setInsights(deriveInsights(revenue, radar))
      setPhase('done')
    }, 1500)
  }

  useEffect(() => { run() }, [])

  const refresh = () => { setKey(k => k + 1); run() }

  const summary = insights.length
    ? `Revenue up ${(((revenue[5].revenue - revenue[0].revenue) / revenue[0].revenue) * 100).toFixed(1)}% this half-year. Net margin ${(((revenue[5].revenue - revenue[5].expenses) / revenue[5].revenue) * 100).toFixed(1)}% — healthy with upward momentum.`
    : ''

  return (
    <motion.div
      variants={fadeUp} custom={0.5} initial="hidden" animate="visible"
      className="rounded-2xl p-5"
      style={{
        background: 'var(--tc-card-bg)',
        border: '1px solid rgba(139,92,246,0.35)',
        boxShadow: '0 0 0 1px rgba(139,92,246,0.08), 0 8px 40px rgba(139,92,246,0.10)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, lineHeight: 1, flexShrink: 0,
            boxShadow: '0 0 16px rgba(139,92,246,0.4)',
          }}>✦</div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>AI Business Insights</h3>
            <p className="text-xs" style={{ color: 'var(--tc-text-3)' }}>Powered by TaxCalm Intelligence</p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={phase === 'analyzing'}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500,
            background: phase === 'analyzing' ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.22)',
            color: phase === 'analyzing' ? 'rgba(167,139,250,0.4)' : '#a78bfa',
            cursor: phase === 'analyzing' ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            display: 'inline-block',
            animation: phase === 'analyzing' ? 'tc-spin 0.9s linear infinite' : 'none',
          }}>⟳</span>
          {phase === 'analyzing' ? 'Analysing…' : 'Refresh'}
        </button>
      </div>

      {/* Analysing skeleton */}
      <AnimatePresence mode="wait">
        {phase === 'analyzing' && (
          <motion.div key="skel"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="space-y-3"
          >
            {[0.7, 0.55, 0.85, 0.62].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.10)' }} className="tc-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div style={{ height: 11, width: `${w * 60}%`, borderRadius: 6, background: 'rgba(139,92,246,0.10)' }} className="tc-shimmer" />
                  <div style={{ height: 9, width: `${w * 100}%`, borderRadius: 6, background: 'rgba(139,92,246,0.07)' }} className="tc-shimmer" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key={`done-${key}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
          >
            {/* Summary sentence */}
            <div className="rounded-xl px-4 py-3 mb-4 text-xs leading-relaxed"
              style={{
                background: 'rgba(139,92,246,0.07)',
                border: '1px solid rgba(139,92,246,0.15)',
                color: 'var(--tc-text-2)',
              }}
            >
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>Summary — </span>
              <TypingText text={summary} speed={18} />
            </div>

            {/* Insight cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {insights.map((ins, i) => (
                <motion.div
                  key={ins.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
                  onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                  style={{
                    borderRadius: 14, padding: '12px 14px',
                    background: activeIdx === i ? `rgba(${ins.color.slice(1).match(/../g).map(h => parseInt(h,16)).join(',')},0.10)` : 'var(--tc-notif-bg)',
                    border: `1px solid ${activeIdx === i ? ins.color + '55' : 'var(--tc-card-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                    boxShadow: activeIdx === i ? `0 0 20px ${ins.glow}` : 'none',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: ins.glow,
                      border: `1px solid ${ins.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, lineHeight: 1, flexShrink: 0,
                    }}>
                      {ins.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color: 'var(--tc-text-1)' }}>{ins.title}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 6,
                          background: ins.glow, color: ins.badgeColor, letterSpacing: 0.02,
                        }}>{ins.badge}</span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--tc-text-3)' }}>
                        {ins.summary}
                      </p>
                      <AnimatePresence>
                        {activeIdx === i && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="mt-2 pt-2 text-xs leading-relaxed"
                              style={{
                                color: ins.badgeColor,
                                borderTop: `1px solid ${ins.color}22`,
                              }}
                            >
                              💡 {ins.action}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-center mt-3 text-xs" style={{ color: 'var(--tc-text-3)', opacity: 0.55 }}>
              Click any card for actionable recommendation
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .tc-cursor {
          display: inline-block; width: 2px; height: 1em;
          background: #a78bfa; margin-left: 1px; vertical-align: text-bottom;
          animation: tc-blink 0.95s step-end infinite;
        }
        @keyframes tc-blink { 0%,100%{ opacity:1 } 50%{ opacity:0 } }
        @keyframes tc-spin { to { transform: rotate(360deg) } }
        .tc-shimmer {
          position: relative; overflow: hidden;
        }
        .tc-shimmer::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: tc-shimmer-move 1.4s ease-in-out infinite;
        }
        @keyframes tc-shimmer-move {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
      `}</style>
    </motion.div>
  )
}

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
  const showToast = useToast()
  const [trendData, setTrendData] = useState(revenueData)

  const handleTrendDataSubmit = (data, format) => {
    try {
      const newTrends = data.map((item, idx) => ({
        month: item.month || item[0] || `M${idx + 1}`,
        revenue: parseFloat(item.revenue || item[1] || 0),
        expenses: parseFloat(item.expenses || item[2] || 0),
      }))
      
      setTrendData([...trendData, ...newTrends])
      showToast?.(`Added ${newTrends.length} trend data point(s)`, 'success')
    } catch (e) {
      showToast?.(`Error: ${e.message}`, 'error')
    }
  }

  const handleBulkDataImport = (parsedData, fileFormat) => {
    try {
      const newTrends = parsedData.map((item, idx) => ({
        month: item.month || item.Month || `M${idx + 1}`,
        revenue: parseFloat(item.revenue || item.Revenue || 0),
        expenses: parseFloat(item.expenses || item.Expenses || 0),
      })).filter(item => item.revenue > 0 || item.expenses > 0)
      
      if (newTrends.length > 0) {
        setTrendData([...trendData, ...newTrends])
        showToast?.(`✅ Imported ${newTrends.length} records from ${fileFormat}`, 'success')
      }
    } catch (e) {
      showToast?.(`❌ Import failed: ${e.message}`, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Business Trends</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Key financial and compliance trends for your business</p>
      </motion.div>

      {/* Multi-Format Data Input for Trends */}
      <MultiFormatDataInput onDataSubmit={handleTrendDataSubmit} dataType="trends" />

      {/* Bulk Data Importer for huge datasets */}
      <BulkDataImporter onDataImport={handleBulkDataImport} dataType="trends" />

      {/* Future Insights - AI & Data Science Analysis */}
      <FutureInsights revenueData={trendData} />

      {/* AI Insights */}
      <AIInsightsPanel revenue={trendData} radar={radarData} />

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
          <AreaChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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

      {/* Competitive Analysis */}
      <CompetitiveAnalysis />
    </div>
  )
}
