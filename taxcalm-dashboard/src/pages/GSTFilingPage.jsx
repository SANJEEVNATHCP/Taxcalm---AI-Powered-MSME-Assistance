import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileCheck, Clock, AlertCircle, CheckCircle2, Upload, ArrowUpRight, Calendar, ChevronRight, ChevronLeft } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const filings = [
  { id: 1, form: 'GSTR-1', period: 'Feb 2026', due: 'Mar 11, 2026', status: 'overdue', taxable: '₹4,18,000', tax: '₹62,700', type: 'Outward Supplies' },
  { id: 2, form: 'GSTR-3B', period: 'Feb 2026', due: 'Mar 20, 2026', status: 'pending', taxable: '₹4,18,000', tax: '₹62,700', type: 'Summary Return' },
  { id: 3, form: 'GSTR-1', period: 'Jan 2026', due: 'Feb 11, 2026', status: 'filed', taxable: '₹3,91,000', tax: '₹58,650', type: 'Outward Supplies' },
  { id: 4, form: 'GSTR-3B', period: 'Jan 2026', due: 'Feb 20, 2026', status: 'filed', taxable: '₹3,91,000', tax: '₹58,650', type: 'Summary Return' },
  { id: 5, form: 'GSTR-9', period: 'FY 2024-25', due: 'Dec 31, 2025', status: 'filed', taxable: '₹42,80,000', tax: '₹6,42,000', type: 'Annual Return' },
  { id: 6, form: 'GSTR-2B', period: 'Feb 2026', due: 'Mar 14, 2026', status: 'upcoming', taxable: '—', tax: '—', type: 'ITC Statement' },
]

const statusCfg = {
  overdue:  { label: 'Overdue',  bg: 'bg-red-400/10',      text: 'text-red-400',    icon: AlertCircle },
  pending:  { label: 'Pending',  bg: 'bg-yellow-400/10',   text: 'text-yellow-400', icon: Clock },
  filed:    { label: 'Filed',    bg: 'bg-emerald-400/10',  text: 'text-emerald-400',icon: CheckCircle2 },
  upcoming: { label: 'Upcoming', bg: 'bg-blue-400/10',     text: 'text-blue-400',   icon: Calendar },
}

const summaryStats = [
  { label: 'Total Tax Paid YTD', value: '₹7,48,200', color: 'emerald' },
  { label: 'ITC Claimed YTD', value: '₹2,14,500', color: 'blue' },
  { label: 'Pending Filings', value: '2', color: 'yellow' },
  { label: 'Late Fees at Risk', value: '₹2,500', color: 'red' },
]
const colorMap = {
  emerald: { bg: 'rgba(52,211,153,0.12)',   text: '#34d399' },
  blue:    { bg: 'rgba(96,165,250,0.12)',    text: '#60a5fa' },
  yellow:  { bg: 'rgba(251,191,36,0.12)',    text: '#fbbf24' },
  red:     { bg: 'rgba(248,113,113,0.12)',   text: '#f87171' },
}

export default function GSTFilingPage({ setActiveNav }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveNav('features')}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
        style={{ background: 'var(--tc-btn-micro)', border: '1px solid var(--tc-card-border)', color: 'var(--tc-text-2)' }}>
        <ChevronLeft className="w-3.5 h-3.5" /> Back to Features
      </button>
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>GST Filing</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Track, prepare and submit your GST returns</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
          onClick={() => window.open('https://www.gst.gov.in', '_blank', 'noopener noreferrer')}>
          <Upload className="w-3.5 h-3.5" /> File on GST Portal
        </motion.button>
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => {
          const c = colorMap[s.color]
          return (
            <motion.div key={s.label} variants={fadeUp} custom={i} initial="hidden" animate="visible"
              className="rounded-2xl p-5"
              style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
              <p className="text-xl font-bold" style={{ color: c.text }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--tc-text-3)' }}>{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Filing list */}
      <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Filing Tracker</h3>
          <button className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
            style={{ color: 'var(--tc-accent)' }}>
            Full history <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filings.map((f, i) => {
          const cfg = statusCfg[f.status]
          const Icon = cfg.icon
          const isOpen = selected === f.id
          return (
            <div key={f.id} style={{ borderBottom: i < filings.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}>
              <motion.div variants={fadeUp} custom={i * 0.3} initial="hidden" animate="visible"
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => setSelected(isOpen ? null : f.id)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <FileCheck className="w-4 h-4" style={{ color: '#a78bfa' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>{f.form}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{f.type} · {f.period}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--tc-text-2)' }}>Due: {f.due}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Tax: {f.tax}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: 'var(--tc-text-3)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
              </motion.div>

              {isOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-4" style={{ background: 'var(--tc-btn-micro)', borderTop: '1px solid var(--tc-divider)' }}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                    {[
                      ['Period', f.period], ['Due Date', f.due], ['Taxable Turnover', f.taxable], ['Tax Liability', f.tax]
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl p-3" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
                        <p className="text-[10px] font-medium" style={{ color: 'var(--tc-text-3)' }}>{k}</p>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--tc-text-1)' }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {f.status !== 'filed' && (
                    <button
                      className="mt-3 text-xs font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
                      onClick={() => window.open('https://www.gst.gov.in', '_blank', 'noopener noreferrer')}>
                      Prepare & File Now →
                    </button>
                  )}
                  {f.status === 'filed' && (
                    <p className="mt-3 text-xs font-semibold flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Successfully filed — Acknowledgement available on GST Portal
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          )
        })}
      </motion.div>

      {/* ITC Reconciliation banner */}
      <motion.div variants={fadeUp} custom={10} initial="hidden" animate="visible"
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(59,130,246,0.1))', border: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.2)' }}>
          <FileCheck className="w-5 h-5" style={{ color: '#a78bfa' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>ITC Reconciliation</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Match GSTR-2B auto-drafted credits with your purchase register to maximise legitimate ITC claims.</p>
        </div>
        <button className="text-xs font-semibold px-4 py-2 rounded-xl flex-shrink-0 transition-colors"
          style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(124,58,237,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(124,58,237,0.2)'}>
          Reconcile Now →
        </button>
      </motion.div>
    </div>
  )
}
