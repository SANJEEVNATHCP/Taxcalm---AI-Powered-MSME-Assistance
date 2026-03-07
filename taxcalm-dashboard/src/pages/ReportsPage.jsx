import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, TrendingUp, BarChart2, DollarSign, Receipt, RefreshCw, Calendar, ChevronLeft } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const reportTypes = [
  { id: 'pl',       title: 'Profit & Loss',       desc: 'Revenue, expenses and net profit',         icon: TrendingUp,  color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { id: 'bs',       title: 'Balance Sheet',        desc: 'Assets, liabilities and equity snapshot',  icon: BarChart2,   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { id: 'cf',       title: 'Cash Flow',            desc: 'Operating, investing and financing flows',  icon: DollarSign,  color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
  { id: 'gst',      title: 'GST Summary',          desc: 'Output tax, ITC and net GST liability',    icon: Receipt,     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  { id: 'tds',      title: 'TDS Report',           desc: 'Deductions under each section',             icon: FileText,    color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  { id: 'exp',      title: 'Expense Analysis',     desc: 'Categorical breakdown of expenses',         icon: BarChart2,   color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
]

const recentReports = [
  { name: 'Profit & Loss — Feb 2026',    type: 'P&L',   size: '128 KB', date: 'Mar 3, 2026',  format: 'PDF' },
  { name: 'Balance Sheet — Q3 FY26',     type: 'BS',    size: '94 KB',  date: 'Feb 28, 2026', format: 'XLSX' },
  { name: 'GST Summary — Feb 2026',      type: 'GST',   size: '76 KB',  date: 'Feb 20, 2026', format: 'PDF' },
  { name: 'TDS Report — Q3 FY26',        type: 'TDS',   size: '52 KB',  date: 'Feb 15, 2026', format: 'PDF' },
]

export default function ReportsPage({ setActiveNav }) {
  const [generating, setGenerating] = useState(null)
  const [period, setPeriod] = useState('monthly')

  const handleGenerate = (id) => {
    setGenerating(id)
    setTimeout(() => setGenerating(null), 1700)
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveNav('features')}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
        style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)', color: 'var(--tc-text-2)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> Back to Features
      </button>
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Reports</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Generate, view and download financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden text-xs" style={{ border: '1px solid var(--tc-input-border)' }}>
            {['monthly', 'quarterly', 'yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 font-semibold capitalize transition-all"
                style={period === p ? { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff' } : { background: 'transparent', color: 'var(--tc-text-3)' }}>
                {p}
              </button>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)', color: 'var(--tc-text-2)' }}>
            <Calendar className="w-3.5 h-3.5" /> Mar 2026
          </motion.button>
        </div>
      </motion.div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report, i) => (
          <motion.div key={report.id} variants={fadeUp} custom={i} initial="hidden" animate="visible"
            whileHover={{ y: -3 }}
            className="rounded-2xl p-5 cursor-pointer"
            style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: report.bg }}>
                <report.icon className="w-5 h-5" style={{ color: report.color }} />
              </div>
              {generating === report.id && (
                <span className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin mt-1" />
              )}
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>{report.title}</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--tc-text-3)' }}>{report.desc}</p>
            <div className="flex gap-2">
              <button onClick={() => handleGenerate(report.id)}
                disabled={generating === report.id}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-50 text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
                {generating === report.id ? 'Generating…' : <><RefreshCw className="w-3 h-3" /> Generate</>}
              </button>
              <button className="flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl transition-colors hover:opacity-80"
                style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-input-border)', color: 'var(--tc-text-2)' }}>
                <Download className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent reports */}
      <motion.div variants={fadeUp} custom={7} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Recent Reports</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Previously generated documents</p>
        </div>
        {recentReports.map((report, i) => (
          <div key={i}
            className="flex items-center gap-4 px-5 py-3.5 transition-colors"
            style={{ borderBottom: i < recentReports.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.1)' }}>
              <FileText className="w-4 h-4" style={{ color: '#a78bfa' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--tc-text-1)' }}>{report.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{report.date} · {report.size}</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'var(--tc-btn-micro)', color: 'var(--tc-text-3)' }}>
              {report.format}
            </span>
            <button className="transition-opacity hover:opacity-70 flex-shrink-0"
              style={{ color: 'var(--tc-text-3)' }}>
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
