import { motion } from 'framer-motion'
import { BookOpen, TrendingUp, TrendingDown, Wallet, ArrowUpRight, Plus, ChevronLeft } from 'lucide-react'
import { useToast } from '../contexts/ToastContext.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

const ledgerEntries = [
  { id: 1, date: 'Mar 01', narration: 'Office Rent Payment', debit: 32000, credit: null, balance: 568000, type: 'debit' },
  { id: 2, date: 'Mar 02', narration: 'Client Receipt — Rajan Exports', debit: null, credit: 185000, balance: 753000, type: 'credit' },
  { id: 3, date: 'Mar 03', narration: 'AWS Cloud Bills', debit: 8400, credit: null, balance: 744600, type: 'debit' },
  { id: 4, date: 'Mar 05', narration: 'Salary Disbursement March', debit: 85000, credit: null, balance: 659600, type: 'debit' },
  { id: 5, date: 'Mar 06', narration: 'Client Receipt — Mehta Industries', debit: null, credit: 210000, balance: 869600, type: 'credit' },
  { id: 6, date: 'Mar 06', narration: 'Google Ads Billing', debit: 18000, credit: null, balance: 851600, type: 'debit' },
]

const accounts = [
  { name: 'Cash & Bank', value: '₹8,51,600', change: '+12.4%', up: true, color: 'emerald' },
  { name: 'Accounts Receivable', value: '₹3,24,000', change: '+5.1%', up: true, color: 'blue' },
  { name: 'Accounts Payable', value: '₹1,08,000', change: '-3.2%', up: false, color: 'red' },
  { name: 'Fixed Assets', value: '₹24,50,000', change: '+0.8%', up: true, color: 'yellow' },
]

const colorMap = {
  emerald: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  blue:    { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa' },
  red:     { bg: 'rgba(248,113,113,0.12)', text: '#f87171' },
  yellow:  { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
}

export default function AccountingPage({ setActiveNav }) {
  const showToast = useToast()
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
          <h2 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Accounting</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>Ledger, accounts summary and balance overview</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => showToast('New entry form coming soon', 'info')}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
          <Plus className="w-3.5 h-3.5" /> New Entry
        </motion.button>
      </motion.div>

      {/* Account summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc, i) => {
          const c = colorMap[acc.color]
          return (
            <motion.div key={acc.name} variants={fadeUp} custom={i} initial="hidden" animate="visible"
              whileHover={{ y: -3 }}
              className="rounded-2xl p-5"
              style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg }}>
                <Wallet className="w-4 h-4" style={{ color: c.text }} strokeWidth={2} />
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--tc-text-1)' }}>{acc.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>{acc.name}</p>
              <span className={`mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block`}
                style={{ background: acc.up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: acc.up ? '#34d399' : '#f87171' }}>
                {acc.change}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Ledger table */}
      <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tc-text-1)' }}>General Ledger</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tc-text-3)' }}>March 2026</p>
          </div>
          <button onClick={() => showToast('Exporting ledger to Excel…', 'success')} className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
            style={{ color: 'var(--tc-accent)' }}>
            Export <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-12 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide"
          style={{ borderBottom: '1px solid var(--tc-divider)', color: 'var(--tc-text-3)' }}>
          <span className="col-span-1">Date</span>
          <span className="col-span-5">Narration</span>
          <span className="col-span-2 text-right">Debit (₹)</span>
          <span className="col-span-2 text-right">Credit (₹)</span>
          <span className="col-span-2 text-right">Balance (₹)</span>
        </div>

        {ledgerEntries.map((entry, i) => (
          <motion.div key={entry.id} variants={fadeUp} custom={i * 0.3} initial="hidden" animate="visible"
            className="grid grid-cols-12 px-5 py-3.5 text-sm transition-colors"
            style={{ borderBottom: i < ledgerEntries.length - 1 ? '1px solid var(--tc-divider)' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--tc-btn-micro)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span className="col-span-1 text-xs" style={{ color: 'var(--tc-text-3)' }}>{entry.date}</span>
            <span className="col-span-5 text-xs font-medium truncate" style={{ color: 'var(--tc-text-1)' }}>{entry.narration}</span>
            <span className="col-span-2 text-right text-xs font-semibold" style={{ color: entry.debit ? '#f87171' : 'transparent' }}>
              {entry.debit ? entry.debit.toLocaleString('en-IN') : '—'}
            </span>
            <span className="col-span-2 text-right text-xs font-semibold" style={{ color: entry.credit ? '#34d399' : 'transparent' }}>
              {entry.credit ? entry.credit.toLocaleString('en-IN') : '—'}
            </span>
            <span className="col-span-2 text-right text-xs font-semibold" style={{ color: 'var(--tc-text-1)' }}>
              {entry.balance.toLocaleString('en-IN')}
            </span>
          </motion.div>
        ))}

        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderTop: '1px solid var(--tc-divider)', background: 'var(--tc-btn-micro)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--tc-text-2)' }}>Closing Balance</span>
          <div className="flex items-center gap-6 text-xs font-bold">
            <span style={{ color: '#f87171' }}>Dr: ₹1,43,400</span>
            <span style={{ color: '#34d399' }}>Cr: ₹3,95,000</span>
            <span style={{ color: 'var(--tc-text-1)' }}>₹8,51,600</span>
          </div>
        </div>
      </motion.div>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'Total Income', value: '₹8,42,000', icon: TrendingUp, color: '#34d399', bg: 'rgba(52,211,153,0.1)', items: ['Service Revenue: ₹6,20,000', 'Product Sales: ₹1,52,000', 'Other Income: ₹70,000'] },
          { title: 'Total Expenses', value: '₹2,18,500', icon: TrendingDown, color: '#f87171', bg: 'rgba(248,113,113,0.1)', items: ['Salaries: ₹85,000', 'Rent: ₹32,000', 'Marketing: ₹18,000', 'Tech & Cloud: ₹8,400'] },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div key={item.title} variants={fadeUp} custom={i + 5} initial="hidden" animate="visible"
              className="rounded-2xl p-5"
              style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: item.bg }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--tc-text-3)' }}>{item.title}</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--tc-text-1)' }}>{item.value}</p>
                </div>
              </div>
              <div className="space-y-2">
                {item.items.map((line, j) => (
                  <div key={j} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--tc-divider)' }}>
                    <span className="text-xs" style={{ color: 'var(--tc-text-3)' }}>{line.split(':')[0]}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--tc-text-2)' }}>{line.split(':')[1]}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
