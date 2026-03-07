import { motion } from 'framer-motion'
import { ShieldCheck, Clock, AlertCircle, CheckCircle2, Calendar, ArrowUpRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const filings = [
  { id: 1, name: 'GSTR-3B', desc: 'Monthly summary return', due: 'Mar 20, 2026', status: 'pending', penalty: '₹50/day after due' },
  { id: 2, name: 'GSTR-1', desc: 'Outward supplies return', due: 'Mar 11, 2026', status: 'overdue', penalty: '₹50/day' },
  { id: 3, name: 'GSTR-9', desc: 'Annual return FY 2024-25', due: 'Dec 31, 2025', status: 'filed', penalty: null },
  { id: 4, name: 'ITC-04', desc: 'Job work return', due: 'Apr 25, 2026', status: 'upcoming', penalty: null },
  { id: 5, name: 'GSTR-2B', desc: 'Auto-drafted ITC statement', due: 'Mar 14, 2026', status: 'upcoming', penalty: null },
  { id: 6, name: 'CMP-08', desc: 'Composition dealer return', due: 'Apr 18, 2026', status: 'upcoming', penalty: null },
]

const statusConfig = {
  pending:  { label: 'Pending',  bg: 'bg-yellow-400/10', text: 'text-yellow-400', icon: Clock,         dot: 'bg-yellow-400' },
  overdue:  { label: 'Overdue',  bg: 'bg-red-400/10',    text: 'text-red-400',    icon: AlertCircle,   dot: 'bg-red-400' },
  filed:    { label: 'Filed',    bg: 'bg-emerald-400/10', text: 'text-emerald-400', icon: CheckCircle2, dot: 'bg-emerald-400' },
  upcoming: { label: 'Upcoming', bg: 'bg-blue-400/10',   text: 'text-blue-400',   icon: Calendar,      dot: 'bg-blue-400' },
}

export default function CompliancePage() {
  const score = 78

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Compliance Checker</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Track filing deadlines and avoid penalties</p>
      </motion.div>

      {/* Score + Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
          className="rounded-2xl p-5 sm:col-span-1"
          style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--tc-text-3)' }}>Compliance Score</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold" style={{ color: 'var(--tc-text-1)' }}>{score}</span>
            <span className="text-lg font-medium mb-1" style={{ color: 'var(--tc-text-3)' }}>/100</span>
          </div>
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--tc-card-border)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#5b21b6)' }} />
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--tc-text-3)' }}>Good standing — 1 overdue filing</p>
        </motion.div>

        {[
          { label: 'Filings Due', value: '2', sub: 'within 30 days', color: 'yellow' },
          { label: 'Overdue', value: '1', sub: 'GSTR-1 pending', color: 'red' },
          { label: 'Filed This Year', value: '8', sub: 'on time', color: 'emerald' },
        ].map((item, i) => (
          <motion.div key={item.label} variants={fadeUp} custom={i + 2} initial="hidden" animate="visible"
            className="rounded-2xl p-5"
            style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--tc-text-3)' }}>{item.label}</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--tc-text-1)' }}>{item.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--tc-text-3)' }}>{item.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Filings table */}
      <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Filing Calendar</h3>
          <button
            onClick={() => window.open('https://www.gst.gov.in', '_blank', 'noopener noreferrer')}
            className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
            Set reminders <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div>
          {filings.map((f, i) => {
            const cfg = statusConfig[f.status]
            const Icon = cfg.icon
            return (
              <motion.div key={f.id} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                className="flex items-center gap-4 px-5 py-4 transition-colors"
                style={{ borderBottom: i < filings.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--tc-btn-micro)' }}>
                  <ShieldCheck className="w-4 h-4" style={{ color: 'var(--tc-text-3)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>{f.name}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{f.desc}</p>
                  {f.penalty && <p className="text-[11px] text-red-400 mt-0.5">Penalty: {f.penalty}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--tc-text-2)' }}>{f.due}</p>
                  {f.status !== 'filed' && (
                    <button
                      className="mt-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                      onClick={() => window.open('https://www.gst.gov.in', '_blank', 'noopener noreferrer')}
                    >
                      File now →
                    </button>
                  )}
                  {f.status === 'filed' && (
                    <p className="mt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-0.5 justify-end">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
