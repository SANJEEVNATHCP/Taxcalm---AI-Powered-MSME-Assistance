import { useState } from 'react'
import { motion } from 'framer-motion'
import { IndianRupee, Receipt, Calculator, ChevronRight, CheckCircle2, AlertCircle, Info, ChevronLeft } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const tdsEntries = [
  { section: '194C', nature: 'Contractor Payments', tds: '₹4,200', amount: '₹2,10,000', month: 'Mar 2026', status: 'deducted' },
  { section: '194J', nature: 'Professional Fees',   tds: '₹3,500', amount: '₹35,000',  month: 'Mar 2026', status: 'deducted' },
  { section: '194I', nature: 'Rent',                tds: '₹3,200', amount: '₹32,000',  month: 'Mar 2026', status: 'pending' },
  { section: '194A', nature: 'Interest',            tds: '₹420',   amount: '₹4,200',   month: 'Feb 2026', status: 'deposited' },
]

const taxSlabs = [
  { range: 'Up to ₹3,00,000',           rate: '0%',   applicable: false },
  { range: '₹3,00,001 – ₹7,00,000',    rate: '5%',   applicable: false },
  { range: '₹7,00,001 – ₹10,00,000',   rate: '10%',  applicable: false },
  { range: '₹10,00,001 – ₹12,00,000',  rate: '15%',  applicable: false },
  { range: '₹12,00,001 – ₹15,00,000',  rate: '20%',  applicable: true },
  { range: 'Above ₹15,00,000',         rate: '30%',  applicable: false },
]

const advanceTax = [
  { installment: '1st', due: 'Jun 15, 2025', paid: '₹28,000', required: '₹28,000', status: 'paid' },
  { installment: '2nd', due: 'Sep 15, 2025', paid: '₹28,000', required: '₹28,000', status: 'paid' },
  { installment: '3rd', due: 'Dec 15, 2025', paid: '₹56,000', required: '₹56,000', status: 'paid' },
  { installment: '4th', due: 'Mar 15, 2026', paid: '₹0',      required: '₹28,000', status: 'due' },
]

export default function IncomeTaxPage({ setActiveNav }) {
  const [regime, setRegime] = useState('new')

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
          <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Income Tax</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>TDS, advance tax, ITR status and tax planning</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
          onClick={() => window.open('https://www.incometax.gov.in', '_blank', 'noopener noreferrer')}>
          <Receipt className="w-3.5 h-3.5" /> File ITR
        </motion.button>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Estimated Tax', value: '₹1,40,000', color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
          { label: 'TDS Deducted', value: '₹22,320', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
          { label: 'Advance Tax Paid', value: '₹1,12,000', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
          { label: 'Balance Due', value: '₹5,680', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
        ].map((item, i) => (
          <motion.div key={item.label} variants={fadeUp} custom={i} initial="hidden" animate="visible"
            className="rounded-2xl p-5" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: item.bg }}>
              <IndianRupee className="w-4 h-4" style={{ color: item.color }} strokeWidth={2} />
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--tc-text-1)' }}>{item.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tax Regime & Slabs */}
        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible"
          className="rounded-2xl p-5" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>Tax Slabs</h3>
            <div className="flex rounded-xl overflow-hidden text-xs" style={{ border: '1px solid var(--tc-input-border)' }}>
              {['new', 'old'].map(r => (
                <button key={r} onClick={() => setRegime(r)}
                  className="px-3 py-1.5 font-semibold capitalize transition-all"
                  style={regime === r ? { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff' } : { background: 'transparent', color: 'var(--tc-text-3)' }}>
                  {r} Regime
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {taxSlabs.map((slab, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                style={{ background: slab.applicable ? 'rgba(139,92,246,0.1)' : 'var(--tc-btn-micro)', border: slab.applicable ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent' }}>
                <span className="text-xs" style={{ color: slab.applicable ? '#c4b5fd' : 'var(--tc-text-2)' }}>{slab.range}</span>
                <span className="text-xs font-bold" style={{ color: slab.applicable ? '#a78bfa' : 'var(--tc-text-2)' }}>{slab.rate}</span>
                {slab.applicable && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}>Your bracket</span>}
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3 flex items-center gap-1" style={{ color: 'var(--tc-text-3)' }}>
            <Info className="w-3 h-3" /> Based on estimated annual income of ₹13,80,000
          </p>
        </motion.div>

        {/* Advance Tax */}
        <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible"
          className="rounded-2xl p-5" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--tc-text-1)' }}>Advance Tax Schedule</h3>
          <div className="space-y-2">
            {advanceTax.map((row, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl"
                style={{ background: row.status === 'due' ? 'rgba(251,191,36,0.06)' : 'var(--tc-btn-micro)', border: row.status === 'due' ? '1px solid rgba(251,191,36,0.2)' : '1px solid transparent' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: row.status === 'paid' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)' }}>
                  {row.status === 'paid'
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: 'var(--tc-text-1)' }}>{row.installment} Installment</p>
                  <p className="text-[11px]" style={{ color: 'var(--tc-text-3)' }}>Due: {row.due}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: row.status === 'paid' ? '#34d399' : '#fbbf24' }}>{row.paid}</p>
                  <p className="text-[11px]" style={{ color: 'var(--tc-text-3)' }}>Required: {row.required}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--tc-divider)' }}>
            <p className="text-xs" style={{ color: 'var(--tc-text-3)' }}>4th installment due in 8 days</p>
            <button className="text-xs font-semibold transition-colors hover:opacity-70" style={{ color: 'var(--tc-accent)' }}>
              Pay Now →
            </button>
          </div>
        </motion.div>
      </div>

      {/* TDS Table */}
      <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>TDS Deductions — March 2026</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Tax Deducted at Source under various sections</p>
        </div>
        {tdsEntries.map((entry, i) => (
          <motion.div key={i} variants={fadeUp} custom={i * 0.3} initial="hidden" animate="visible"
            className="flex items-center gap-4 px-5 py-3.5 transition-colors"
            style={{ borderBottom: i < tdsEntries.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.12)' }}>
              <Calculator className="w-4 h-4" style={{ color: '#a78bfa' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--tc-text-1)' }}>{entry.nature}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Section {entry.section} · {entry.month}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold" style={{ color: 'var(--tc-text-1)' }}>TDS: {entry.tds}</p>
              <p className="text-xs" style={{ color: 'var(--tc-text-3)' }}>Amount: {entry.amount}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${entry.status === 'deposited' ? 'bg-emerald-400/10 text-emerald-400' : entry.status === 'deducted' ? 'bg-blue-400/10 text-blue-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
